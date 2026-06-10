// Generates favicon + PWA icons from the VideoNest sunset badge using sharp.
// Run with: node scripts/generate-icons.mjs
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

// Standard badge (rounded rect, transparent corners).
const badgeSvg = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <defs>${GRAD}</defs>
  <rect x="3" y="3" width="42" height="42" rx="13" fill="url(#vnSunset)"/>
  <path d="M15 16 L24 33 L33 16" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="24" cy="19.5" r="2.3" fill="#fff"/>
</svg>`;

// Maskable: full-bleed gradient square so any mask shape looks intentional.
const maskableSvg = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <defs>${GRAD}</defs>
  <rect x="0" y="0" width="48" height="48" fill="url(#vnSunset)"/>
  <path d="M15 17 L24 32 L33 17" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="24" cy="20" r="2.2" fill="#fff"/>
</svg>`;

async function png(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}

async function main() {
  await mkdir(publicDir, { recursive: true });

  const outputs = [
    ["icon-192.png", badgeSvg, 192],
    ["icon-512.png", badgeSvg, 512],
    ["icon-maskable-192.png", maskableSvg, 192],
    ["icon-maskable-512.png", maskableSvg, 512],
    ["apple-touch-icon.png", maskableSvg, 180],
    ["favicon-32.png", badgeSvg, 32],
    ["favicon-16.png", badgeSvg, 16],
  ];

  for (const [name, svg, size] of outputs) {
    const buf = await png(svg, size);
    await writeFile(join(publicDir, name), buf);
    console.log(`wrote public/${name} (${size}px)`);
  }

  // Multi-resolution favicon.ico (16 + 32 + 48).
  const icoSizes = [16, 32, 48];
  const icoBuffers = await Promise.all(icoSizes.map((s) => png(badgeSvg, s)));
  // sharp can't write .ico; embed the 32px PNG as favicon.ico fallback is not
  // valid ICO. Instead keep favicon.ico from Next's app/icon. We still emit a
  // crisp SVG favicon for modern browsers.
  await writeFile(join(publicDir, "icon.svg"), Buffer.from(badgeSvg));
  console.log("wrote public/icon.svg");
  void icoBuffers;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
