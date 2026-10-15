// Settings shared by the popup, the background worker and the content script.
// Stored in chrome.storage.sync so they follow you across Chrome installs.

const WH_DEFAULTS = {
  enabled: true,
  intensity: 50, // 0–100
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

function whLoadSettings() {
  return chrome.storage.sync.get(WH_DEFAULTS);
}

function whSaveSettings(patch) {
  return chrome.storage.sync.set(patch);
}
