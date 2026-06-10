import {
  EngineError,
  type OnProgress,
  type OptimizeResult,
  type VideoMeta,
  type WorkerRequest,
  type WorkerResponse,
} from "./types";

export type {
  EncodePlan,
  EngineError as EngineErrorType,
  EngineErrorCode,
  EnginePath,
  OnProgress,
  OptimizeResult,
  OutputInfo,
  Progress,
  ProgressStage,
  VideoMeta,
} from "./types";
export { EngineError, INPUT_LIMITS } from "./types";

let counter = 0;

/**
 * Public engine API. Runs the full optimization inside a dedicated Web Worker
 * so the main thread stays responsive and progress is real-time. Resolves with
 * the output MP4 blob + metadata, or rejects with a typed EngineError.
 */
export function optimize(
  file: File,
  profileId: string,
  onProgress: OnProgress,
  signal?: AbortSignal,
): Promise<OptimizeResult> {
  return new Promise<OptimizeResult>((resolve, reject) => {
    if (typeof Worker === "undefined") {
      reject(new EngineError("UNSUPPORTED_BROWSER", "Web Workers aren't available here."));
      return;
    }

    if (signal?.aborted) {
      reject(new EngineError("CANCELLED"));
      return;
    }

    let worker: Worker;
    try {
      worker = new Worker(new URL("./worker.ts", import.meta.url));
    } catch (err) {
      reject(
        new EngineError("UNSUPPORTED_BROWSER", "Could not start the video engine.", {
          cause: err,
        }),
      );
      return;
    }

    const id = ++counter;
    let settled = false;

    const cleanup = () => {
      signal?.removeEventListener("abort", onAbort);
      worker.terminate();
    };

    const onAbort = () => {
      worker.postMessage({ type: "cancel", id });
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.id !== id) return;

      if (msg.type === "progress") {
        onProgress(msg.progress);
        return;
      }
      if (settled) return;

      if (msg.type === "done") {
        settled = true;
        cleanup();
        resolve({
          blob: msg.blob,
          meta: msg.meta,
          output: msg.output,
          plan: msg.plan,
          path: msg.path,
        });
      } else if (msg.type === "error") {
        settled = true;
        cleanup();
        reject(new EngineError(msg.code, msg.message));
      }
    };

    worker.onerror = (event) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new EngineError("ENCODE_FAILED", event.message || "Video engine crashed."));
    };

    const request: WorkerRequest = { type: "optimize", id, file, profileId };
    worker.postMessage(request);
  });
}

/**
 * Probe a file's metadata in a short-lived worker (keeps Mediabunny out of the
 * main bundle). Used to show detected specs before the user commits to encode.
 */
export function probeFile(file: File): Promise<VideoMeta> {
  return new Promise<VideoMeta>((resolve, reject) => {
    if (typeof Worker === "undefined") {
      reject(new EngineError("UNSUPPORTED_BROWSER", "Web Workers aren't available here."));
      return;
    }

    let worker: Worker;
    try {
      worker = new Worker(new URL("./worker.ts", import.meta.url));
    } catch (err) {
      reject(
        new EngineError("UNSUPPORTED_BROWSER", "Could not start the video engine.", {
          cause: err,
        }),
      );
      return;
    }

    const id = ++counter;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.id !== id) return;
      if (msg.type === "probed") {
        worker.terminate();
        resolve(msg.meta);
      } else if (msg.type === "error") {
        worker.terminate();
        reject(new EngineError(msg.code, msg.message));
      }
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new EngineError("DECODE_FAILED", event.message || "Could not read the file."));
    };

    const request: WorkerRequest = { type: "probe", id, file };
    worker.postMessage(request);
  });
}
