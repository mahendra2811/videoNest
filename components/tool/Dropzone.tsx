"use client";

import { motion } from "framer-motion";
import { FileVideo, UploadCloud } from "lucide-react";
import * as React from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { INPUT_LIMITS } from "@/lib/engine/types";
import { formatBytes } from "@/lib/utils";

const ACCEPT = {
  "video/*": [".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v", ".3gp"],
};

export function Dropzone({ onAccept }: { onAccept: (file: File) => void }) {
  const onDrop = React.useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        const rejection = rejections[0];
        const tooBig = rejection.errors.some((e) => e.code === "file-too-large");
        if (tooBig) {
          toast.error(
            `That file is over ${formatBytes(INPUT_LIMITS.maxFileBytes)}. Try a shorter clip or a smaller export.`,
          );
        } else {
          toast.error("That file type isn't supported. Try MP4, MOV, WebM, MKV or AVI.");
        }
        return;
      }
      const file = accepted[0];
      if (file) onAccept(file);
    },
    [onAccept],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: INPUT_LIMITS.maxFileBytes,
    multiple: false,
    noClick: false,
    noKeyboard: false,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        {...getRootProps({
          "aria-label": "Drop a video here or tap to choose a file",
        })}
        className={`group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-10 text-center transition-all sm:p-14 ${
          isDragActive
            ? "border-transparent bg-sunset/10 ring-2 ring-ring"
            : "border-border bg-surface hover:border-transparent hover:bg-surface-2"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sunset text-white shadow-warm">
          {isDragActive ? <FileVideo className="h-8 w-8" /> : <UploadCloud className="h-8 w-8" />}
        </div>
        <div className="space-y-1">
          <p className="text-lg font-bold tracking-tight">
            {isDragActive ? "Drop your video" : "Add your video"}
          </p>
          <p className="text-sm text-muted">Tap to choose a video from your device</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-12 rounded-2xl bg-sunset px-6 text-sm font-semibold text-white shadow-warm transition-all hover:shadow-warm-lg active:scale-[0.98]"
        >
          Choose a video
        </button>
      </div>
    </motion.div>
  );
}
