"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { flags } from "@/lib/config/flags";
import { DEFAULT_PROFILE_ID, getProfile } from "@/lib/config/profiles";
import { optimize, probeFile } from "@/lib/engine";
import { EngineError, INPUT_LIMITS, type OptimizeResult, type VideoMeta } from "@/lib/engine/types";
import { uploadAndOptimize } from "@/lib/heavy/client";
import { showLocalNotification } from "@/lib/notify/notify";
import { useToolStore } from "@/lib/store/tool";
import { formatDuration } from "@/lib/utils";
import { Dropzone } from "./Dropzone";
import { ErrorCard } from "./ErrorCard";
import { Preview } from "./Preview";
import { ProcessingRing } from "./ProcessingRing";
import { SegmentResults } from "./SegmentResults";
import { ShareActions } from "./ShareActions";

export function ToolScreen({ profileId = DEFAULT_PROFILE_ID }: { profileId?: string }) {
  const platformLabel = getProfile(profileId)?.label ?? "this platform";
  const {
    phase,
    file,
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
    track("optimize_started");

    try {
      const res = await optimize(file, profileId, setProgress, controller.signal);
      setDone(res);
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
  }, [file, profileId, platformLabel, startProcessing, setProgress, setDone, setError]);

  const handleCancel = React.useCallback(() => {
    abortRef.current?.abort();
  }, []);

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
            {inputUrl && (
              <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-3xl border border-border bg-black">
                <video
                  src={inputUrl}
                  muted
                  playsInline
                  controls
                  className="max-h-[46vh] w-full object-contain"
                />
              </div>
            )}
            <Button
              onClick={handleOptimize}
              size="lg"
              className="h-14 w-full text-base"
              disabled={probing}
            >
              <Sparkles className="h-5 w-5" />
              {probing ? "Reading your video…" : "Make it sharp"}
            </Button>
            <Button onClick={reset} variant="secondary" size="lg" className="w-full">
              Choose another video
            </Button>
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
              </>
            ) : (
              <SegmentResults results={results} outputUrls={outputUrls} profileId={profileId} />
            )}
            <Button onClick={reset} variant="secondary" size="lg" className="w-full">
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
