// Settings shared by the popup, the background worker and the content script.
// Stored in chrome.storage.sync so they follow you across Chrome installs.

const WH_DEFAULTS = {
  enabled: true,
  intensity: 50, // 0–100
  color: "neutral", // "neutral" or a key of WH_COLORS
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
  purple: "110, 91, 242",
  blue: "59, 130, 246",
  teal: "76, 195, 207",
  green: "92, 196, 106",
  yellow: "247, 201, 72",
  orange: "242, 153, 74",
  red: "235, 87, 87",
};

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
