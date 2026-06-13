#!/usr/bin/env node
/**
 * VideoNest measurement analyzer (A1).
 *
 * Runs `ffprobe -show_streams -show_format` on every video file in a folder of
 * platform-served clips and emits a normalized JSON array to stdout. Each row
 * pairs the parsed input spec (from the filename) with the *measured* output
 * (authoritative, from ffprobe).
 *
 * Usage:
 *   node measurement/analyze.mjs [folder]      # default: ./measurement/clips
 *   node measurement/analyze.mjs clips > measurement/results.json
 *
 * Requires `ffprobe` on PATH (ships with ffmpeg).
 */

import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const VIDEO_EXT = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv", ".3gp", ".avi"]);

/** Parse "30000/1001" or "30" → 29.97 / 30 (rounded to 2 dp). */
function parseRate(r) {
  if (!r || typeof r !== "string") return null;
  const [n, d] = r.split("/").map(Number);
  if (!Number.isFinite(n)) return null;
  const fps = d && Number.isFinite(d) && d !== 0 ? n / d : n;
  return Math.round(fps * 100) / 100;
}

function toInt(v) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse the input spec encoded in the filename, e.g.
 * `1080p_30fps_9x16_highmotion_sdr_29s__android_HD.mp4`. Unparseable fields are
 * left null — the measured output is what matters.
 */
function parseInputSpec(filename) {
  const base = filename.replace(/\.[^.]+$/, "");
  const [specPart, devicePart] = base.split("__");
  const tokens = specPart.split("_");
  const spec = {
    raw: filename,
    resolution: null,
    fps: null,
    aspect: null,
    content: null,
    range: null,
    durationSec: null,
    device: null,
    quality: null,
  };
  for (const t of tokens) {
    if (/^\d{3,4}p$/.test(t)) spec.resolution = t;
    else if (/^\d+fps$/.test(t)) spec.fps = toInt(t);
    else if (/^\d+x\d+$/.test(t)) spec.aspect = t.replace("x", ":");
    else if (/^(sdr|hdr)$/i.test(t)) spec.range = t.toLowerCase();
    else if (/^\d+s$/.test(t)) spec.durationSec = toInt(t);
    else if (/^(highmotion|static|detail|darkgradient|gradient)$/i.test(t)) spec.content = t;
  }
  if (devicePart) {
    const dt = devicePart.split("_");
    for (const t of dt) {
      if (/^(android|ios)$/i.test(t)) spec.device = t.toLowerCase();
      else if (/^(standard|hd)$/i.test(t)) spec.quality = t.toUpperCase();
    }
  }
  return spec;
}

async function ffprobe(file) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_streams",
    "-show_format",
    file,
  ]);
  return JSON.parse(stdout);
}

function normalize(file, probe) {
  const streams = probe.streams ?? [];
  const format = probe.format ?? {};
  const v = streams.find((s) => s.codec_type === "video") ?? {};
  const a = streams.find((s) => s.codec_type === "audio");

  const formatBitrate = toInt(format.bit_rate);
  const vBitrate = toInt(v.bit_rate) ?? formatBitrate;
  const aBitrate = a ? toInt(a.bit_rate) : null;

  return {
    inputSpec: parseInputSpec(path.basename(file)),
    outputWidth: toInt(v.width),
    outputHeight: toInt(v.height),
    outputFps: parseRate(v.avg_frame_rate) ?? parseRate(v.r_frame_rate),
    vBitrate,
    vCodec: v.codec_name ?? null,
    profile: v.profile ?? null,
    level: v.level != null ? v.level / 10 : null,
    pixFmt: v.pix_fmt ?? null,
    aBitrate,
    aCodec: a?.codec_name ?? null,
    container: (format.format_name ?? "").split(",")[0] || null,
    sizeBytes: toInt(format.size),
  };
}

async function main() {
  const dir = process.argv[2] ?? path.join("measurement", "clips");
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    process.stderr.write(
      `\nNo clips folder at "${dir}". Create it, add platform-served clips ` +
        `(see measurement/MEASUREMENT.md), then re-run.\n`,
    );
    process.stdout.write("[]\n");
    process.exit(0);
  }

  const files = entries
    .filter((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()))
    .map((f) => path.join(dir, f))
    .sort();

  if (files.length === 0) {
    process.stderr.write(`\nNo video files found in "${dir}".\n`);
    process.stdout.write("[]\n");
    process.exit(0);
  }

  const rows = [];
  for (const file of files) {
    try {
      const probe = await ffprobe(file);
      rows.push(normalize(file, probe));
      process.stderr.write(`✓ ${path.basename(file)}\n`);
    } catch (err) {
      process.stderr.write(`✗ ${path.basename(file)} — ${err?.message ?? err}\n`);
      rows.push({
        inputSpec: parseInputSpec(path.basename(file)),
        error: String(err?.message ?? err),
      });
    }
  }

  process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
}

main();
