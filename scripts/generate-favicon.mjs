// Generiert das Favicon von Headbang Handwerk e. V. aus dem Original-SVG-Logo.
// Ergebnis: 512x512 PNG, vollstaendig schwarzer Hintergrund (#000000),
// Logo mittig und unveraendert, maximal gross aber vollstaendig sichtbar.
// Aufruf: node scripts/generate-favicon.mjs

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = path.join(root, 'Headbang Handwerk e.V. Logo Final.svg');
const targets = [
  path.join(root, 'app', 'icon.png'),
  path.join(root, 'public', 'headbang-favicon.png'),
];

const SIZE = 512;
const BACKGROUND = '#000000';

const svg = await readFile(svgPath, 'utf8');

// Einzige Anpassung: das Vollbild-Hintergrund-Rechteck des SVG (Original: #030303)
// auf reines Schwarz (#000000) setzen. Alle Logo-Pfade bleiben unveraendert.
const backgroundPathPattern = /<path\s+id="Path 0"[^>]*\/>/;
if (!backgroundPathPattern.test(svg)) {
  throw new Error('Hintergrund-Pfad im SVG nicht gefunden – Abbruch, um das Logo nicht zu veraendern.');
}
const svgBlack = svg.replace(
  backgroundPathPattern,
  '<path id="Path 0" fill="#000000" d="m0 359.5v359.5h778v-719h-778z"/>'
);

// SVG hochaufloesend rastern (Dichte skaliert die 778x719-Zeichenflaeche hoch),
// anschliessend verlustfrei und unverzerrt in 512x512 einpassen (fit: contain)
// und auf opaken Schwarzhintergrund legen.
const png = await sharp(Buffer.from(svgBlack), { density: 200 })
  .resize(SIZE, SIZE, { fit: 'contain', background: BACKGROUND, kernel: 'lanczos3' })
  .flatten({ background: BACKGROUND })
  .png({ compressionLevel: 9 })
  .toBuffer();

for (const target of targets) {
  await writeFile(target, png);
  console.log(`geschrieben: ${path.relative(root, target)} (${png.length} Bytes)`);
}

// Verifizierung: Abmessungen und Eckpixel (muessen rein schwarz sein)
const meta = await sharp(png).metadata();
const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
const px = (x, y) => {
  const i = (y * info.width + x) * info.channels;
  return [data[i], data[i + 1], data[i + 2]];
};
console.log(`Abmessungen: ${meta.width}x${meta.height}, Kanäle: ${info.channels}`);
console.log('Eckpixel:', px(0, 0), px(SIZE - 1, 0), px(0, SIZE - 1), px(SIZE - 1, SIZE - 1));
