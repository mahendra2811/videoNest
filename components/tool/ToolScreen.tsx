"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Sparkles } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { flags } from "@/lib/config/flags";
import { DEFAULT_PROFILE_ID, requireProfile } from "@/lib/config/profiles";
import {
  type EditState,
  editStateToOptions,
  editStateWithRemembered,
  hasEdits,
  rememberedFromEditState,
} from "@/lib/edit/state";
import { optimize, probeFile } from "@/lib/engine";
import { EngineError, INPUT_LIMITS, type OptimizeResult, type VideoMeta } from "@/lib/engine/types";
import { uploadAndOptimize } from "@/lib/heavy/client";
import { showLocalNotification } from "@/lib/notify/notify";
import { useFavouritesStore } from "@/lib/store/favourites";
import { useToolStore } from "@/lib/store/tool";
import { formatDuration } from "@/lib/utils";
import { CompareOnStatus } from "./CompareOnStatus";
import { Dropzone } from "./Dropzone";
import { EditPanel } from "./EditPanel";
import { ErrorCard } from "./ErrorCard";
import { Preview } from "./Preview";
import { ProcessingRing } from "./ProcessingRing";
import { SegmentResults } from "./SegmentResults";
import { ShareActions } from "./ShareActions";

export function ToolScreen({ profileId = DEFAULT_PROFILE_ID }: { profileId?: string }) {
  const profile = requireProfile(profileId);
  const platformLabel = profile.label;
  const {
    phase,
    file,
    meta,
    probing,
    progress,
    results,
    inputUrl,
    outputUrls,
    error,
    selectFile,
    setMeta,
    setProbing,
    startProcessing,
    setProgress,
    setDone,
    setError,
    reset,
  } = useToolStore();

  const [editState, setEditState] = React.useState<EditState>(() =>
    editStateWithRemembered(useFavouritesStore.getState().lastOptions),
  );
  const [editing, setEditing] = React.useState(false);
  const edited = hasEdits(editState, profile);

  const abortRef = React.useRef<AbortController | null>(null);
  // Track the latest selected file so the probe effect ignores stale results.
  const probeTokenRef = React.useRef(0);

  // Probe the file's metadata when one is selected.
  React.useEffect(() => {
    if (phase !== "selected" || !file) return;
    const token = ++probeTokenRef.current;
    setProbing(true);
    probeFile(file)
      .then((m) => {
        if (token !== probeTokenRef.current) return;
        setMeta(m);
        if (m.durationSec > INPUT_LIMITS.maxDurationSec) {
          toast.error("That video is over 10 minutes. Trim it down and try again.");
          reset();
        }
      })
      .catch(() => {
        if (token !== probeTokenRef.current) return;
        // Non-fatal: we can still attempt to optimize; metadata just stays "—".
        setMeta(null);
      })
      .finally(() => {
        if (token === probeTokenRef.current) setProbing(false);
      });
  }, [phase, file, setMeta, setProbing, reset]);

  // On unmount (navigating away), abort any in-flight job and clear state so a
  // stale result/video doesn't linger when the user returns to the tool.
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
      reset();
    };
  }, [reset]);

  const handleOptimize = React.useCallback(async () => {
    if (!file) return;
    const controller = new AbortController();
    abortRef.current = controller;
    startProcessing();
    track("optimize_started", { edited });

    try {
      const options = editStateToOptions(editState, profile);
      const res = await optimize(file, profileId, setProgress, controller.signal, options);
      setDone(res);
      // Remember this platform + the scalar options for next time (E1/E3).
      useFavouritesStore.getState().recordUse(profileId);
      useFavouritesStore.getState().setLastOptions(rememberedFromEditState(editState));
      const primary = res[0];
      track("optimize_succeeded", {
        path: primary.path,
        parts: res.length,
        out_kb: Math.round(primary.output.sizeBytes / 1024),
      });
      if (res.length > 1) {
        toast.info(`Split into ${res.length} parts so each fits ${platformLabel}'s limit.`);
      } else if (primary.plan.trimToSec) {
        toast.info(
          `Trimmed to the first ${formatDuration(primary.plan.trimToSec)} for ${platformLabel}.`,
        );
      }
      toast.success(
        res.length > 1 ? "Your parts are ready to share." : "Your video is ready to share.",
      );
      // If the user switched away during the encode, ping them.
      if (typeof document !== "undefined" && document.hidden) {
        void showLocalNotification(
          res.length > 1 ? `Your ${res.length} parts are ready` : "Your video is ready",
          { body: `Optimized for ${platformLabel}. Tap to download.`, tag: "vn-done", url: "/" },
        );
      }
    } catch (err) {
      const code = err instanceof EngineError ? err.code : "ENCODE_FAILED";
      if (code === "CANCELLED") {
        // Return to the selected state so the user can retry.
        useToolStore.setState({ phase: "selected" });
        return;
      }
      const message = err instanceof Error ? err.message : "Unknown error";
      setError({ code, message });
      track("optimize_failed", { code });
    } finally {
      abortRef.current = null;
    }
  }, [
    file,
    profileId,
    profile,
    platformLabel,
    editState,
    edited,
    startProcessing,
    setProgress,
    setDone,
    setError,
  ]);

  const handleCancel = React.useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const resetAll = React.useCallback(() => {
    setEditState(editStateWithRemembered(useFavouritesStore.getState().lastOptions));
    setEditing(false);
    reset();
  }, [reset]);

  // Opt-in server heavy-tier (only when enabled). Uploads the source — the only
  // path where a video leaves the device.
  const handleHeavy = React.useCallback(async () => {
    if (!file) return;
    const controller = new AbortController();
    abortRef.current = controller;
    startProcessing();
    track("optimize_started", { tier: "server" });
    try {
      const r = await uploadAndOptimize(
        file,
        profileId,
        (p) =>
          setProgress(
            p.stage === "uploading"
              ? {
                  stage: "optimizing",
                  value: 0.02 + (p.value ?? 0) * 0.5,
                  label: "Uploading",
                }
              : { stage: "optimizing", value: 0.6, label: "Optimizing" },
          ),
        controller.signal,
      );
      const blob = await (await fetch(r.url)).blob();
      const meta: VideoMeta = useToolStore.getState().meta ?? {
        container: "",
        vcodec: "",
        width: r.width,
        height: r.height,
        fps: 30,
        durationSec: 0,
        bitrate: 0,
        pixfmt: "",
        hasAudio: true,
        rotation: 0,
        isHdr: false,
        sizeBytes: file.size,
      };
      const result: OptimizeResult = {
        blob,
        meta,
        path: "server",
        plan: {
          targetWidth: r.width,
          targetHeight: r.height,
          blurPad: false,
          aspectMode: "fit",
          hqDownscale: false,
          videoCodec: "avc",
          sharpen: false,
          normalizeLoudness: false,
          overlays: [],
          fps: 30,
          fastPath: false,
          videoBitrate: 0,
          audio: null,
          keyFrameIntervalSec: 2,
          effectiveDurationSec: meta.durationSec,
          sizeCapBytes: 0,
          notes: ["Optimized on the VideoNest server"],
        },
        output: {
          width: r.width,
          height: r.height,
          durationSec: meta.durationSec,
          sizeBytes: r.sizeBytes,
          filename: r.filename,
        },
      };
      setDone([result]);
      track("optimize_succeeded", { tier: "server", out_kb: Math.round(r.sizeBytes / 1024) });
      toast.success("Optimized on our server.");
      if (typeof document !== "undefined" && document.hidden) {
        void showLocalNotification("Your video is ready", {
          body: `Optimized for ${platformLabel}. Tap to download.`,
          tag: "vn-done",
          url: "/",
        });
      }
    } catch (err) {
      const code = err instanceof EngineError ? err.code : "ENCODE_FAILED";
      if (code === "CANCELLED") {
        useToolStore.setState({ phase: "selected" });
        return;
      }
      setError({
        code,
        message: err instanceof Error ? err.message : "Server optimization failed.",
      });
      track("optimize_failed", { tier: "server", code });
    } finally {
      abortRef.current = null;
    }
  }, [file, profileId, platformLabel, startProcessing, setProgress, setDone, setError]);

  const handleSelect = React.useCallback(
    (f: File) => {
      setEditState(editStateWithRemembered(useFavouritesStore.getState().lastOptions));
      setEditing(false);
      selectFile(f);
      track("file_selected", { size_kb: Math.round(f.size / 1024) });
    },
    [selectFile],
  );

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" exit={{ opacity: 0 }}>
            <Dropzone onAccept={handleSelect} />
          </motion.div>
        )}

        {phase === "selected" && file && (
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {editing ? (
              <EditPanel
                state={editState}
                setState={setEditState}
                profile={profile}
                meta={meta}
                inputUrl={inputUrl}
              />
            ) : (
              inputUrl && (
                <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-3xl border border-border bg-black">
                  <video
                    src={inputUrl}
                    muted
                    playsInline
                    controls
                    className="max-h-[46vh] w-full object-contain"
                  />
                </div>
              )
            )}
            <Button
              onClick={handleOptimize}
              size="lg"
              className="h-14 w-full text-base"
              disabled={probing}
            >
              <Sparkles className="h-5 w-5" />
              {probing ? "Reading your video…" : edited ? "Apply & make it sharp" : "Make it sharp"}
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setEditing((e) => !e)}
                variant="secondary"
                size="lg"
                className="w-full"
              >
                <Pencil className="h-4 w-4" />
                {editing ? "Hide edits" : edited ? "Edits added" : "Edit video"}
              </Button>
              <Button onClick={resetAll} variant="secondary" size="lg" className="w-full">
                Choose another
              </Button>
            </div>
            {flags.serverTierEnabled && (
              <button
                type="button"
                onClick={handleHeavy}
                disabled={probing}
                className="text-center text-xs text-muted underline underline-offset-4 hover:text-foreground"
              >
                Big clip giving trouble? Try our server instead.
              </button>
            )}
          </motion.div>
        )}

        {phase === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ProcessingRing progress={progress} onCancel={handleCancel} />
          </motion.div>
        )}

        {phase === "done" && results.length > 0 && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            {results.length === 1 ? (
              <>
                <Preview
                  inputUrl={inputUrl}
                  outputUrl={outputUrls[0]}
                  result={results[0]}
                  profileId={profileId}
                />
                <ShareActions
                  blob={results[0].blob}
                  filename={results[0].output.filename}
                  profileId={profileId}
                />
                <CompareOnStatus
                  optimizedBlob={results[0].blob}
                  optimizedName={results[0].output.filename}
                  original={file}
                />
              </>
            ) : (
              <SegmentResults results={results} outputUrls={outputUrls} profileId={profileId} />
            )}
            <Button onClick={resetAll} variant="secondary" size="lg" className="w-full">
              Optimize another video
            </Button>
          </motion.div>
        )}

        {phase === "error" && error && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ErrorCard
              error={error}
              onRetry={handleOptimize}
              onReset={reset}
              onHeavy={flags.serverTierEnabled ? handleHeavy : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
