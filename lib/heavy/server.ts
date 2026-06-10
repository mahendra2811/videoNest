import type { NextRequest } from "next/server";

/** The Vercel Blob public host suffix. */
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/** Pathname prefix the client uploads under (see lib/heavy/client.ts). */
const UPLOAD_PREFIX = "uploads/";

/** Max bytes we'll pull from a source blob (mirrors the upload cap). */
export const MAX_SOURCE_BYTES = 2_000_000_000;

/**
 * Validate a source blob URL against SSRF: it must be an https URL on our
 * Vercel Blob host, with no embedded credentials, pointing at the upload area.
 * Parsing with `new URL` (not a substring regex) avoids parser/validator
 * differentials like `https://evil.com/?x=.public.blob.vercel-storage.com/`.
 */
export function parseAllowedBlobUrl(blobUrl: string): { ok: boolean; pathname: string } {
  try {
    const url = new URL(blobUrl);
    const ok =
      url.protocol === "https:" &&
      url.username === "" &&
      url.password === "" &&
      url.hostname.endsWith(BLOB_HOST_SUFFIX) &&
      // Only delete/fetch blobs under the client upload prefix.
      url.pathname.replace(/^\/+/, "").startsWith(UPLOAD_PREFIX);
    return { ok, pathname: url.pathname.replace(/^\/+/, "") };
  } catch {
    return { ok: false, pathname: "" };
  }
}

/**
 * Same-origin guard for state-changing/abuse-prone routes. Browsers send an
 * `Origin` header on POST; we require its host to match the deployment host.
 * Not a substitute for rate limiting (see route notes), but blocks trivial
 * cross-site abuse of the upload-token endpoint.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const host = request.headers.get("host");
  if (!host) return false;
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  // No Origin header: fall back to Referer host match if present.
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }
  // Neither header present — reject for these sensitive endpoints.
  return false;
}
