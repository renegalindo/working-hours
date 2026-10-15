// Draws the toolbar icon (a clock with a blue rim) as PNGs, with no dependencies.
// Run: node scripts/make-icons.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const INK = [51, 51, 51];
const RIM = [25, 140, 255];
const PAPER = [255, 255, 255];
const SUPERSAMPLE = 4;

// Radii in unit space: a white outline (so the icon reads on dark toolbars), the blue rim, then the face.
const OUTLINE_R = 0.49;
const RIM_R = 0.41;
const FACE_R = 0.3;
const HAND_DROP = 0.035;

// Returns [r, g, b, a] for a point in unit space (0–1), or null for transparent.
function shade(x, y, size) {
  const dx = x - 0.5;
  const dy = y - 0.5;
  const r = Math.hypot(dx, dy);
  if (r > OUTLINE_R) return null;
  if (r > RIM_R) return [...PAPER, 255];
  if (r > FACE_R) return [...RIM, 255];

  // Distance to a segment; comparing it to half the width gives a hand with rounded ends.
  const nearSegment = (x1, y1, x2, y2, width) => {
    const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / ((x2 - x1) ** 2 + (y2 - y1) ** 2)));
    return Math.hypot(x - (x1 + t * (x2 - x1)), y - (y1 + t * (y2 - y1))) < width / 2;
  };
  const handWidth = size <= 16 ? 0.14 : 0.115;
  // The hands' mass sits above the centre, so nudge the pivot down to look centred.
  const pivotY = 0.5 + HAND_DROP;
  if (nearSegment(0.5, pivotY, 0.5, pivotY - 0.22, handWidth)) return [...INK, 255];
  if (nearSegment(0.5, pivotY, 0.68, pivotY, handWidth)) return [...INK, 255];

  return [...PAPER, 255];
}

function renderPixels(size) {
  const data = Buffer.alloc(size * (size * 4 + 1));
  for (let py = 0; py < size; py++) {
    const rowStart = py * (size * 4 + 1);
    data[rowStart] = 0; // PNG filter: none
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const c = shade((px + (sx + 0.5) / SUPERSAMPLE) / size, (py + (sy + 0.5) / SUPERSAMPLE) / size, size);
          if (!c) continue;
          r += c[0] * c[3]; g += c[1] * c[3]; b += c[2] * c[3]; a += c[3];
        }
      }
      const i = rowStart + 1 + px * 4;
      if (a > 0) {
        data[i] = Math.round(r / a);
        data[i + 1] = Math.round(g / a);
        data[i + 2] = Math.round(b / a);
      }
      data[i + 3] = Math.round(a / SUPERSAMPLE ** 2);
    }
  }
  return data;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length);
  const typed = Buffer.concat([Buffer.from(type, "ascii"), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([length, typed, crc]);
}

function png(size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(renderPixels(size))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [16, 32, 48, 128]) {
  writeFileSync(new URL(`../icons/icon${size}.png`, import.meta.url), png(size));
}
console.log("Icons written to icons/");
