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

// Shade colors as "r, g, b". Neutral adapts to the theme; the rest are the same in both.
const WH_COLORS = {
  neutral: { light: "60, 64, 67", dark: "232, 234, 237" },
  purple: "97, 85, 245",
  blue: "0, 136, 255",
  teal: "3, 195, 207",
  green: "53, 199, 89",
  yellow: "255, 204, 2",
  orange: "255, 141, 41",
  red: "255, 57, 60",
};

// Shade patterns in picker order. Keys match the [data-pattern] rules in content.css and popup.css.
const WH_PATTERNS = {
  lines: "Lines",
  dots: "Dots",
  waves: "Waves",
  stars: "Night sky",
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
