/** Human-readable file size, e.g. 1536000 -> "1.5 MB". */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / k ** i;
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

/** Human-readable duration, e.g. 95 -> "1:35". */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Pretty resolution, e.g. (1080, 1920) -> "1080 × 1920". */
export function formatResolution(width: number, height: number): string {
  return `${Math.round(width)} × ${Math.round(height)}`;
}

/** Uppercase a codec/container label for display, with a sensible fallback. */
export function formatLabel(value: string | undefined | null, fallback = "Unknown"): string {
  if (!value) return fallback;
  return value.toUpperCase();
}
