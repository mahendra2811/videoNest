/** Share helpers built on the Web Share API, with safe capability guards. */

export type DeviceShareMode = "mobile-share" | "mobile-download" | "desktop";

/** True if the current context can share files (mobile browsers, mainly). */
export function canShareFiles(file?: File): boolean {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") {
    return false;
  }
  try {
    if (file) return navigator.canShare({ files: [file] });
    // Probe with a tiny dummy file.
    const probe = new File([new Uint8Array(1)], "probe.mp4", { type: "video/mp4" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/** Coarse mobile detection (for "best way" copy only — never for gating logic). */
export function isLikelyMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const coarse = typeof matchMedia === "function" ? matchMedia("(pointer: coarse)").matches : false;
  return /android|iphone|ipad|ipod|mobile/i.test(ua) || coarse;
}

/** Pick the share guidance mode for the current device. */
export function getShareMode(file?: File): DeviceShareMode {
  if (canShareFiles(file)) return "mobile-share";
  if (isLikelyMobile()) return "mobile-download";
  return "desktop";
}

/** Trigger a download of a blob with the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after a tick so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Share a file via the Web Share API. Returns true if the share sheet opened
 * (or completed), false if sharing isn't available. Throws only on unexpected
 * errors (callers treat AbortError — user cancelled — as a no-op).
 */
export async function shareFile(
  file: File,
  opts: { title?: string; text?: string } = {},
): Promise<boolean> {
  if (!canShareFiles(file)) return false;
  try {
    await navigator.share({ files: [file], title: opts.title, text: opts.text });
    return true;
  } catch (err) {
    // User dismissed the share sheet — not an error worth surfacing.
    if (err instanceof DOMException && err.name === "AbortError") return false;
    throw err;
  }
}
