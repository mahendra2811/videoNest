/// <reference lib="webworker" />
import { probe } from "./probe";
import { runOptimize } from "./run";
import { EngineError, type WorkerRequest, type WorkerResponse } from "./types";

// Compiled by webpack in a worker context; excluded from the main tsconfig
// type-check on purpose (webworker + dom libs conflict otherwise).
declare const self: DedicatedWorkerGlobalScope;

type IncomingMessage = WorkerRequest | { type: "cancel"; id: number };

const controllers = new Map<number, AbortController>();

self.onmessage = async (event: MessageEvent<IncomingMessage>) => {
  const data = event.data;

  if (data.type === "cancel") {
    controllers.get(data.id)?.abort();
    return;
  }

  if (data.type === "probe") {
    const { id, file } = data;
    try {
      const meta = await probe(file);
      self.postMessage({ type: "probed", id, meta } satisfies WorkerResponse);
    } catch (err) {
      const code = err instanceof EngineError ? err.code : "DECODE_FAILED";
      const message = err instanceof Error ? err.message : "Could not read this file.";
      self.postMessage({ type: "error", id, code, message } satisfies WorkerResponse);
    }
    return;
  }

  if (data.type === "optimize") {
    const { id, file, profileId, options } = data;
    const controller = new AbortController();
    controllers.set(id, controller);

    const post = (msg: WorkerResponse) => self.postMessage(msg);

    try {
      const results = await runOptimize(
        file,
        profileId,
        (progress) => post({ type: "progress", id, progress }),
        controller.signal,
        options,
      );
      post({ type: "done", id, results });
    } catch (err) {
      const code = err instanceof EngineError ? err.code : "ENCODE_FAILED";
      const message = err instanceof Error ? err.message : "Unknown error";
      post({ type: "error", id, code, message });
    } finally {
      controllers.delete(id);
    }
  }
};
