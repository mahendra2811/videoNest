"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { DEFAULT_PROFILE_ID } from "@/lib/config/profiles";
import { optimize, probeFile } from "@/lib/engine";
import { EngineError, INPUT_LIMITS } from "@/lib/engine/types";
import { useToolStore } from "@/lib/store/tool";
import { formatDuration } from "@/lib/utils";
import { Dropzone } from "./Dropzone";
import { ErrorCard } from "./ErrorCard";
import { FileMeta } from "./FileMeta";
import { Preview } from "./Preview";
import { ProcessingRing } from "./ProcessingRing";
import { ShareActions } from "./ShareActions";

export function ToolScreen({ profileId = DEFAULT_PROFILE_ID }: { profileId?: string }) {
  const {
    phase,
    file,
    meta,
    probing,
    progress,
    result,
    inputUrl,
    outputUrl,
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

  // Cleanup any in-flight worker on unmount.
  React.useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleOptimize = React.useCallback(async () => {
    if (!file) return;
    const controller = new AbortController();
    abortRef.current = controller;
    startProcessing();
    track("optimize_started");

    try {
      const res = await optimize(file, profileId, setProgress, controller.signal);
      setDone(res);
      track("optimize_succeeded", {
        path: res.path,
        out_kb: Math.round(res.output.sizeBytes / 1024),
      });
      if (res.plan.trimToSec) {
        toast.info(
          `Trimmed to the first ${formatDuration(res.plan.trimToSec)} for WhatsApp Status.`,
        );
      }
      toast.success("Your video is ready to share.");
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
  }, [file, profileId, startProcessing, setProgress, setDone, setError]);

  const handleCancel = React.useCallback(() => {
    abortRef.current?.abort();
  }, []);

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
            className="flex flex-col gap-5"
          >
            <FileMeta file={file} meta={meta} loading={probing} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleOptimize} size="lg" className="flex-1" disabled={probing}>
                <Sparkles className="h-5 w-5" />
                Optimize for WhatsApp Status
              </Button>
              <Button onClick={reset} variant="ghost" size="lg">
                Change video
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ProcessingRing progress={progress} onCancel={handleCancel} />
          </motion.div>
        )}

        {phase === "done" && result && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            <Preview inputUrl={inputUrl} outputUrl={outputUrl} result={result} />
            <ShareActions blob={result.blob} filename={result.output.filename} />
            <Button onClick={reset} variant="ghost">
              Optimize another video
            </Button>
          </motion.div>
        )}

        {phase === "error" && error && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ErrorCard error={error} onRetry={handleOptimize} onReset={reset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
