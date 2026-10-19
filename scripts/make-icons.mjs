// Draws the toolbar icon (a mint punch clock with a white dial) as PNGs, with no dependencies.
// Run: node scripts/make-icons.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

// Mint jade body, lit from above, with darker tones for the groove round the face and the card slot.
const BODY_TOP = [124, 198, 167];
const BODY_BOTTOM = [65, 150, 115];
const GROOVE = [42, 81, 65];
const SLOT = [50, 103, 81];
const FACE_SHADOW = [214, 222, 221];
const PAPER = [255, 255, 255];
const INK = [43, 43, 43];
const TICK = [216, 67, 47];
const SUPERSAMPLE = 8;

// Geometry is in a 100-unit square. The face sits a little high; the base below it holds the card slot.
// The body spans 4–96, and the PNG crops to exactly that so the icon fills its toolbar slot edge to edge.
const VIEW = { from: 4, span: 92 };
// The Web Store wants 96px of artwork centred in a 128px canvas, so its view widens by a third.
const STORE_VIEW = { from: 50 - (92 * 128) / 96 / 2, span: (92 * 128) / 96 };
const FACE = { x: 18, y: 18, w: 64, h: 58, r: 10 };
const SLOT_BOX = { x: 28, y: 84.5, w: 44 };
// The face's shaded top edge makes its centre look low, so the dial drops one 32px pixel to match.
const DIAL_DROP = VIEW.span / 32;
// Hands at 10:07, clear of the quarter ticks. Angles are clockwise from 12.
const MINUTE = { angle: 40, length: 17 };
const HOUR = { angle: 303.5, length: 13.5 };

const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// Signed distance to a rounded rectangle: negative inside.
function roundRect(x, y, { x: rx, y: ry, w, h, r }) {
  const qx = Math.abs(x - (rx + w / 2)) - w / 2 + r;
  const qy = Math.abs(y - (ry + h / 2)) - h / 2 + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function nearSegment(x, y, x1, y1, x2, y2, width) {
  const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / ((x2 - x1) ** 2 + (y2 - y1) ** 2)));
  return Math.hypot(x - (x1 + t * (x2 - x1)), y - (y1 + t * (y2 - y1))) < width / 2;
}

// A hand that tapers from `base` wide at the pivot to `tip` wide, with rounded ends.
function inHand(x, y, cx, cy, { angle, length }, base, tip) {
  const a = (angle * Math.PI) / 180;
  const ux = Math.sin(a), uy = -Math.cos(a);
  const along = (x - cx) * ux + (y - cy) * uy;
  const across = Math.abs((x - cx) * -uy + (y - cy) * ux);
  if (along >= 0 && along <= length && across <= (base + (tip - base) * (along / length)) / 2) return true;
  return Math.hypot(x - cx, y - cy) < base / 2 || Math.hypot(x - (cx + ux * length), y - (cy + uy * length)) < tip / 2;
}

// Small sizes get heavier strokes so details survive; 32px snaps the dial to the pixel grid.
function specFor(size) {
  const k = size <= 16 ? 2 : size <= 32 ? 1.35 : 1;
  const unit = VIEW.span / size; // one pixel, in geometry units
  const snap = (v) => VIEW.from + (Math.floor((v - VIEW.from) / unit) + 0.5) * unit;
  let cx = FACE.x + FACE.w / 2;
  let cy = FACE.y + FACE.h / 2 + DIAL_DROP;
  if (size === 32) [cx, cy] = [snap(cx), snap(cy)];
  return {
    k,
    cx,
    cy,
    groove: Math.max(3.2, 3.2 * k * 0.8),
    rim: Math.max(1.8, 1.4 * k),
    slotH: Math.max(3, 3 * k),
    // Ticks would be single stray pixels at 16px, so they're dropped there. At 32px they're
    // one pixel wide with square ends on pixel edges; larger sizes get rounded ends.
    tickWidth: size <= 16 ? 0 : size === 32 ? unit : 2.5 * k,
    tickFrom: size === 32 ? 4.5 * unit : 15.5,
    tickTo: size === 32 ? 9.5 * unit : 26,
    tickRounded: size !== 32,
  };
}

// Returns premultiplied [r, g, b, a] (a in 0–1) for a point in the 100-unit square.
function shade(x, y, spec) {
  let out = [0, 0, 0, 0];
  const paint = (rgb, alpha = 1) => {
    out = [...rgb.map((v, i) => v * alpha + out[i] * (1 - alpha)), alpha + out[3] * (1 - alpha)];
  };

  const body = { x: 4, y: 4, w: 92, h: 92, r: 22 };
  if (roundRect(x, y, body) > 0) return out;
  paint(lerp(BODY_TOP, BODY_BOTTOM, (y - 4) / 92));
  // A thin light edge, as if lit from above.
  if (Math.abs(roundRect(x, y, { x: 4.9, y: 4.9, w: 90.2, h: 90.2, r: 21 })) < spec.rim / 2) paint(PAPER, 0.35);

  // The face is set into a dark groove, with a soft shadow along its top edge.
  const g = spec.groove;
  if (roundRect(x, y, { x: FACE.x - g, y: FACE.y - g, w: FACE.w + 2 * g, h: FACE.h + 2 * g, r: FACE.r + g }) < 0) paint(GROOVE);
  if (roundRect(x, y, FACE) < 0) paint(lerp(FACE_SHADOW, PAPER, Math.min(1, (y - FACE.y) / (FACE.h * 0.18))));

  // Card slot, with a lit lip below it and a pointer above.
  const slot = { ...SLOT_BOX, h: spec.slotH, r: spec.slotH / 2 };
  const lipH = Math.max(1.5, spec.k);
  if (roundRect(x, y, slot) < 0) paint(SLOT);
  if (roundRect(x, y, { x: slot.x, y: slot.y + slot.h, w: slot.w, h: lipH, r: 1 }) < 0) paint(PAPER, 0.35);
  if (y >= slot.y && Math.abs(x - 50) <= 4.5 * (1 - (y - slot.y) / 5.175)) paint(SLOT);

  const { cx, cy, k } = spec;
  if (spec.tickWidth) {
    for (const angle of [0, 90, 180, 270]) {
      const a = (angle * Math.PI) / 180;
      const [sx, sy] = [Math.sin(a), -Math.cos(a)];
      const along = (x - cx) * sx + (y - cy) * sy;
      const across = Math.abs((x - cx) * -sy + (y - cy) * sx);
      const inTick = spec.tickRounded
        ? nearSegment(x, y, cx + sx * spec.tickFrom, cy + sy * spec.tickFrom, cx + sx * spec.tickTo, cy + sy * spec.tickTo, spec.tickWidth)
        : along >= spec.tickFrom && along <= spec.tickTo && across <= spec.tickWidth / 2;
      if (inTick) paint(TICK);
    }
  }
  if (inHand(x, y, cx, cy, MINUTE, 6.5 * k, 2 * k) || inHand(x, y, cx, cy, HOUR, 6.5 * k, 2 * k)) paint(INK);
  return out;
}

function renderPixels(size, view) {
  const spec = specFor(size);
  const data = Buffer.alloc(size * (size * 4 + 1));
  for (let py = 0; py < size; py++) {
    const rowStart = py * (size * 4 + 1);
    data[rowStart] = 0; // PNG filter: none
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const c = shade(
            view.from + ((px + (sx + 0.5) / SUPERSAMPLE) / size) * view.span,
            view.from + ((py + (sy + 0.5) / SUPERSAMPLE) / size) * view.span,
            spec,
          );
          r += c[0]; g += c[1]; b += c[2]; a += c[3];
        }
      }
      const i = rowStart + 1 + px * 4;
      if (a > 0) {
        data[i] = Math.round(r / a);
        data[i + 1] = Math.round(g / a);
        data[i + 2] = Math.round(b / a);
      }
      data[i + 3] = Math.round((a / SUPERSAMPLE ** 2) * 255);
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

function png(size, view = VIEW) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(renderPixels(size, view))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [16, 32, 48, 128]) {
  writeFileSync(new URL(`../icons/icon${size}.png`, import.meta.url), png(size));
}
writeFileSync(new URL("../store/icon128.png", import.meta.url), png(128, STORE_VIEW));
console.log("Icons written to icons/ and store/");
