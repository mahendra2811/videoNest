// Generates favicons, PWA icons, iOS splash screens, and manifest screenshots
// from the VideoNest sunset badge using sharp. Run: node scripts/generate-icons.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

const GRAD = `
  <linearGradient id="vnSunset" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
    <stop stop-color="#FF8C42"/>
    <stop offset="0.5" stop-color="#FF5E78"/>
    <stop offset="1" stop-color="#FF2E93"/>
  </linearGradient>`;

const badgeSvg = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <defs>${GRAD}</defs>
  <rect x="3" y="3" width="42" height="42" rx="13" fill="url(#vnSunset)"/>
  <path d="M15 16 L24 33 L33 16" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="24" cy="19.5" r="2.3" fill="#fff"/>
</svg>`;

const maskableSvg = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <defs>${GRAD}</defs>
  <rect x="0" y="0" width="48" height="48" fill="url(#vnSunset)"/>
  <path d="M15 17 L24 32 L33 17" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="24" cy="20" r="2.2" fill="#fff"/>
</svg>`;

// Centered badge on the warm app background — used for splash screens.
function splashSvg(width, height) {
  const badge = Math.round(Math.min(width, height) * 0.2);
  const cx = width / 2;
  const cy = height / 2;
  const fontSize = Math.round(badge * 0.42);
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="${badge}" y2="${badge}" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FF8C42"/><stop offset="0.5" stop-color="#FF5E78"/><stop offset="1" stop-color="#FF2E93"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="#FFF9F5"/>
    <g transform="translate(${cx - badge / 2}, ${cy - badge * 0.9})">
      <rect width="${badge}" height="${badge}" rx="${badge * 0.27}" fill="url(#g)"/>
      <path d="M${badge * 0.31} ${badge * 0.33} L${badge * 0.5} ${badge * 0.69} L${badge * 0.69} ${badge * 0.33}"
        stroke="#fff" stroke-width="${badge * 0.075}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="${badge * 0.5}" cy="${badge * 0.41} " r="${badge * 0.048}" fill="#fff"/>
    </g>
    <text x="${cx}" y="${cy + badge * 0.75}" text-anchor="middle"
      font-family="Geist, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#1A1416">VideoNest</text>
  </svg>`;
}

// Branded promo image for manifest screenshots.
function screenshotSvg(width, height, label) {
  const badge = Math.round(Math.min(width, height) * 0.16);
  const cx = width / 2;
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="${width}" y2="${height}" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FFF4EC"/><stop offset="1" stop-color="#FFE9EF"/>
      </linearGradient>
      <linearGradient id="g" x1="0" y1="0" x2="${badge}" y2="${badge}" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FF8C42"/><stop offset="0.5" stop-color="#FF5E78"/><stop offset="1" stop-color="#FF2E93"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <g transform="translate(${cx - badge / 2}, ${height * 0.32})">
      <rect width="${badge}" height="${badge}" rx="${badge * 0.27}" fill="url(#g)"/>
      <path d="M${badge * 0.31} ${badge * 0.33} L${badge * 0.5} ${badge * 0.69} L${badge * 0.69} ${badge * 0.33}"
        stroke="#fff" stroke-width="${badge * 0.075}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </g>
    <text x="${cx}" y="${height * 0.56}" text-anchor="middle" font-family="Geist, Arial, sans-serif" font-size="${Math.round(width * 0.045)}" font-weight="700" fill="#1A1416">VideoNest</text>
    <text x="${cx}" y="${height * 0.62}" text-anchor="middle" font-family="Geist, Arial, sans-serif" font-size="${Math.round(width * 0.026)}" fill="#6B5B60">${label}</text>
  </svg>`;
}

// KEEP IN SYNC with SPLASH_TARGETS in lib/pwa/splash.ts
const SPLASH_TARGETS = [
  { w: 375, h: 667, r: 2, file: "splash-750x1334.png" },
  { w: 414, h: 896, r: 2, file: "splash-828x1792.png" },
  { w: 375, h: 812, r: 3, file: "splash-1125x2436.png" },
  { w: 390, h: 844, r: 3, file: "splash-1170x2532.png" },
  { w: 393, h: 852, r: 3, file: "splash-1179x2556.png" },
  { w: 430, h: 932, r: 3, file: "splash-1290x2796.png" },
  { w: 820, h: 1180, r: 2, file: "splash-1640x2360.png" },
  { w: 834, h: 1194, r: 2, file: "splash-1668x2388.png" },
];

async function pngFromSvg(svg, w, h) {
  return sharp(Buffer.from(svg)).resize(w, h).png().toBuffer();
}

async function main() {
  await mkdir(publicDir, { recursive: true });

  const icons = [
    ["icon-192.png", badgeSvg, 192],
    ["icon-512.png", badgeSvg, 512],
    ["icon-maskable-192.png", maskableSvg, 192],
    ["icon-maskable-512.png", maskableSvg, 512],
    ["icon-maskable-1024.png", maskableSvg, 1024],
    ["apple-touch-icon.png", maskableSvg, 180],
    ["favicon-48.png", badgeSvg, 48],
    ["favicon-32.png", badgeSvg, 32],
    ["favicon-16.png", badgeSvg, 16],
  ];
  for (const [name, svg, size] of icons) {
    await writeFile(join(publicDir, name), await pngFromSvg(svg, size, size));
    console.log(`wrote public/${name} (${size}px)`);
  }

  await writeFile(join(publicDir, "icon.svg"), Buffer.from(badgeSvg));
  console.log("wrote public/icon.svg");

  // iOS splash screens.
  for (const t of SPLASH_TARGETS) {
    const pw = t.w * t.r;
    const ph = t.h * t.r;
    await writeFile(join(publicDir, t.file), await pngFromSvg(splashSvg(pw, ph), pw, ph));
    console.log(`wrote public/${t.file} (${pw}x${ph})`);
  }

  // Manifest screenshots (narrow + wide).
  await writeFile(
    join(publicDir, "screenshot-narrow.png"),
    await pngFromSvg(
      screenshotSvg(1080, 1920, "Keep your videos sharp on any platform"),
      1080,
      1920,
    ),
  );
  await writeFile(
    join(publicDir, "screenshot-wide.png"),
    await pngFromSvg(
      screenshotSvg(1920, 1080, "Optimize videos on your device — free and private"),
      1920,
      1080,
    ),
  );
  console.log("wrote manifest screenshots");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
