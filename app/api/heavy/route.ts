import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { del, put } from "@vercel/blob";
import ffmpegStatic from "ffmpeg-static";
import { type NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/config/profiles";
import type { PlatformProfile } from "@/lib/engine/types";
import { isSameOrigin, MAX_SOURCE_BYTES, parseAllowedBlobUrl } from "@/lib/heavy/server";

// Heavy-tier transcode runs on a Node serverless function. It only activates
// when a Vercel Blob token is configured; otherwise it returns 503 and the app
// stays 100% client-side. This is the opt-in path for sources too large/long
// for the browser engine (see the explicit privacy notice in the UI).
export const runtime = "nodejs";
export const maxDuration = 300;

// Prefer the bundled ffmpeg-static binary when it was actually fetched at
// install time; otherwise fall back to a system `ffmpeg` on PATH.
const staticPath = ffmpegStatic as unknown as string | null;
const ffmpegPath = staticPath && existsSync(staticPath) ? staticPath : "ffmpeg";

/** Build the ffmpeg argument list for a profile (blur-pad to the target box). */
function buildArgs(profile: PlatformProfile, input: string, output: string): string[] {
  const w = profile.maxWidth;
  const h = profile.maxHeight;
  const fps = profile.fpsCap;
  const gop = Math.max(2, 2 * fps);

  // Constrained vs overprovision bitrate (mirrors the client plan).
  let maxrate: number;
  if (profile.bitrateStrategy === "constrained" && profile.sizeCapMB) {
    const total = (profile.sizeCapMB * 1024 * 1024 * 8 * 0.92) / profile.maxDurationSec;
    maxrate = Math.round(Math.max(total - profile.audio.bitrateKbps * 1000, 800_000));
  } else {
    maxrate = Math.min(Math.max(Math.round(w * h * fps * 0.1), 4_000_000), 20_000_000);
  }

  const filter = [
    "split=2[bg][fg]",
    `[bg]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},boxblur=20:3,eq=brightness=-0.06[bgb]`,
    `[fg]scale=${w}:${h}:force_original_aspect_ratio=decrease:force_divisible_by=2[fgs]`,
    "[bgb][fgs]overlay=(W-w)/2:(H-h)/2,setsar=1",
  ].join(";");

  return [
    "-y",
    "-t",
    String(profile.maxDurationSec),
    "-i",
    input,
    "-vf",
    filter,
    "-r",
    String(fps),
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-maxrate",
    String(maxrate),
    "-bufsize",
    String(maxrate * 2),
    "-g",
    String(gop),
    "-c:a",
    "aac",
    "-b:a",
    `${profile.audio.bitrateKbps}k`,
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    output,
  ];
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args);
    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > 8000) stderr = stderr.slice(-8000);
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`));
    });
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Server tier is not configured." }, { status: 503 });
  }
  // Block trivial cross-site abuse of this compute endpoint.
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: { blobUrl?: string; profileId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { blobUrl, profileId } = body;
  if (!blobUrl || !profileId) {
    return NextResponse.json({ error: "Missing blobUrl or profileId." }, { status: 400 });
  }
  const profile = getProfile(profileId);
  if (!profile) {
    return NextResponse.json({ error: "Unknown profile." }, { status: 400 });
  }
  // SSRF guard: parse the URL and require our Blob host + upload prefix (not a
  // substring match). `allowed` is false for anything off-host/credentialed.
  const allowed = parseAllowedBlobUrl(blobUrl);
  if (!allowed.ok) {
    return NextResponse.json({ error: "Invalid source URL." }, { status: 400 });
  }

  const dir = await mkdtemp(join(tmpdir(), "vn-"));
  const inPath = join(dir, "input");
  const outPath = join(dir, "output.mp4");

  try {
    const res = await fetch(blobUrl);
    if (!res.ok) throw new Error("Could not fetch the uploaded file.");
    // Reject oversized sources (mirrors the upload cap) — check the header and
    // the actual byte length.
    const declared = Number(res.headers.get("content-length") ?? "0");
    if (declared > MAX_SOURCE_BYTES) {
      throw new Error("Source file exceeds the size limit.");
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_SOURCE_BYTES) {
      throw new Error("Source file exceeds the size limit.");
    }
    await writeFile(inPath, buf);

    await runFfmpeg(buildArgs(profile, inPath, outPath));

    const outData = await readFile(outPath);
    const uploaded = await put(`videonest-${profile.id}-${Date.now()}.mp4`, outData, {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      url: uploaded.url,
      sizeBytes: outData.byteLength,
      width: profile.maxWidth,
      height: profile.maxHeight,
      filename: `videonest-${profile.id}.mp4`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    // Always delete the user's uploaded source; clean up temp files.
    void del(blobUrl).catch(() => {});
    void rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
