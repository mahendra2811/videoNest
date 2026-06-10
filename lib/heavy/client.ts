import { upload } from "@vercel/blob/client";

export type HeavyResult = {
  url: string;
  sizeBytes: number;
  width: number;
  height: number;
  filename: string;
};

export type HeavyProgress = {
  stage: "uploading" | "processing";
  /** 0..1 during upload; processing is indeterminate (value omitted). */
  value?: number;
};

/**
 * Opt-in server heavy-tier: upload the source directly to Vercel Blob, then ask
 * the serverless route to transcode it and return the optimized result.
 *
 * This is the ONLY path where a video leaves the device — it must be behind an
 * explicit user opt-in + privacy notice. Disabled unless the server tier flag
 * and a Blob store are configured.
 */
export async function uploadAndOptimize(
  file: File,
  profileId: string,
  onProgress?: (p: HeavyProgress) => void,
  signal?: AbortSignal,
): Promise<HeavyResult> {
  onProgress?.({ stage: "uploading", value: 0 });

  const blob = await upload(`uploads/${Date.now()}-${file.name}`, file, {
    access: "public",
    handleUploadUrl: "/api/heavy/upload",
    onUploadProgress: ({ percentage }) =>
      onProgress?.({ stage: "uploading", value: Math.min(Math.max(percentage / 100, 0), 1) }),
  });

  onProgress?.({ stage: "processing" });

  const res = await fetch("/api/heavy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blobUrl: blob.url, profileId }),
    signal,
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Server processing failed.");
  }

  return (await res.json()) as HeavyResult;
}
