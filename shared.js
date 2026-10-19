// Settings shared by the popup, the background worker and the content script.
// Stored in chrome.storage.sync so they follow you across Chrome installs.

const WH_DEFAULTS = {
  enabled: true,
  intensity: 50, // 0–100
  color: "neutral", // "neutral" or a key of WH_COLORS
  pattern: "lines", // a key of WH_PATTERNS
  // Indexed like Date#getDay(): 0 = Sunday … 6 = Saturday. Times are minutes from midnight.
  days: [
    { on: false, start: 540, end: 1020 },
    { on: true, start: 540, end: 1020 },
    { on: true, start: 540, end: 1020 },
    { on: true, start: 540, end: 1020 },
    { on: true, start: 540, end: 1020 },
    { on: true, start: 540, end: 1020 },
    { on: false, start: 540, end: 1020 },
  ],
};

// Shade colors as "r, g, b". Neutral adapts to the theme; the rest are the same in both
// and use Google Calendar's own event colors (named in the comments).
const WH_COLORS = {
  neutral: { light: "60, 64, 67", dark: "232, 234, 237" },
  purple: "63, 81, 181", // Blueberry
  blue: "66, 133, 244", // Cobalt
  teal: "0, 150, 136", // Eucalyptus
  green: "51, 182, 121", // Sage
  yellow: "246, 191, 38", // Banana
  orange: "240, 147, 0", // Mango
  red: "213, 0, 0", // Tomato
};

// Shade patterns in picker order. Keys match the [data-pattern] rules in content.css and popup.css.
const WH_PATTERNS = {
  lines: "Lines",
  dots: "Dots",
  waves: "Waves",
  solid: "Solid",
};

function whPattern(pattern) {
  return pattern in WH_PATTERNS ? pattern : WH_DEFAULTS.pattern;
}

function whShadeRgb(color, dark) {
  const entry = WH_COLORS[color] ?? WH_COLORS.neutral;
  return typeof entry === "string" ? entry : dark ? entry.dark : entry.light;
}

function whLoadSettings() {
  return chrome.storage.sync.get(WH_DEFAULTS);
}

function whSaveSettings(patch) {
  return chrome.storage.sync.set(patch);
}
