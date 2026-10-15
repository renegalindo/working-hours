importScripts("shared.js");

// The toolbar badge reads "OFF" while shading is paused, so you can tell at a glance.
async function refreshBadge() {
  const { enabled } = await whLoadSettings();
  await chrome.action.setBadgeBackgroundColor({ color: "#5f6368" });
  await chrome.action.setBadgeText({ text: enabled ? "" : "OFF" });
}

chrome.runtime.onInstalled.addListener(refreshBadge);
chrome.runtime.onStartup.addListener(refreshBadge);
chrome.storage.onChanged.addListener((changes) => {
  if ("enabled" in changes) refreshBadge();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-shading") return;
  const { enabled } = await whLoadSettings();
  await whSaveSettings({ enabled: !enabled });
});
