// Shades non-working hours on Google Calendar's time grid (Day, Week, N-day views).
//
// Google Calendar renders each day of the time grid as an element carrying a
// `data-datekey` attribute that spans the full 24 hours. We add one overlay layer
// as the first child of each such column, so events (later siblings) paint on top.
// Because shading is positioned as a fraction of the column's height, it follows
// whatever timezone Calendar is currently displaying.

(() => {
  const LAYER_CLASS = "wh-layer";
  const MINUTES_PER_DAY = 1440;
  let settings = null;
  let scheduled = false;

  // data-datekey packs a date as ((year - 1970) << 9) | (month << 5) | day.
  function decodeDateKey(raw) {
    const key = Number(raw);
    if (!Number.isInteger(key) || key <= 0) return null;
    const year = (key >> 9) + 1970;
    const month = (key >> 5) & 15;
    const day = key & 31;
    if (year < 2000 || year > 2200 || month < 1 || month > 12 || day < 1) return null;
    return new Date(year, month - 1, day);
  }

  // Day columns are the tallest datekey elements; all-day cells and month cells are short.
  function findDayColumns() {
    const candidates = [...document.querySelectorAll("[data-datekey]")].map((el) => ({
      el,
      height: el.getBoundingClientRect().height,
    }));
    const tallest = Math.max(0, ...candidates.map((c) => c.height));
    if (tallest < 200) return [];
    return candidates
      .filter((c) => c.height >= tallest * 0.9 && !c.el.parentElement?.closest("[data-datekey]"))
      .map((c) => c.el);
  }

  function offHoursFor(date) {
    const day = settings.days[date.getDay()];
    if (!day?.on || day.end <= day.start) return [[0, MINUTES_PER_DAY]];
    const ranges = [];
    if (day.start > 0) ranges.push([0, day.start]);
    if (day.end < MINUTES_PER_DAY) ranges.push([day.end, MINUTES_PER_DAY]);
    return ranges;
  }

  function isDarkBackground(el) {
    for (let node = el; node; node = node.parentElement) {
      const match = getComputedStyle(node).backgroundColor.match(/[\d.]+/g);
      if (!match) continue;
      const [r, g, b, a = 1] = match.map(Number);
      if (a === 0) continue;
      return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
    }
    return matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function paletteFor(dark) {
    const t = settings.intensity / 100;
    const stripe = 0.05 + 0.4 * t;
    const tint = 0.02 + 0.16 * t;
    const rgb = dark ? "232, 234, 237" : "60, 64, 67";
    return { stripe: `rgba(${rgb}, ${stripe})`, tint: `rgba(${rgb}, ${tint})` };
  }

  function render() {
    scheduled = false;
    if (!settings) return;

    const columns = findDayColumns();
    const active = new Set();

    for (const column of columns) {
      const date = decodeDateKey(column.dataset.datekey);
      if (!date || !settings.enabled) continue;

      const ranges = offHoursFor(date);
      const palette = paletteFor(isDarkBackground(column));
      const signature = JSON.stringify([ranges, palette]);

      let layer = column.querySelector(`:scope > .${LAYER_CLASS}`);
      if (!layer) {
        layer = document.createElement("div");
        layer.className = LAYER_CLASS;
        if (getComputedStyle(column).position === "static") column.style.position = "relative";
        column.prepend(layer);
      }
      active.add(layer);
      if (layer.dataset.signature === signature) continue;

      layer.dataset.signature = signature;
      layer.style.setProperty("--wh-stripe", palette.stripe);
      layer.style.setProperty("--wh-tint", palette.tint);
      layer.replaceChildren(
        ...ranges.map(([from, to]) => {
          const band = document.createElement("div");
          band.className = "wh-band";
          band.style.top = `${(from / MINUTES_PER_DAY) * 100}%`;
          band.style.height = `${((to - from) / MINUTES_PER_DAY) * 100}%`;
          return band;
        }),
      );
    }

    // Clear layers left behind when shading is turned off or a column stops qualifying.
    for (const layer of document.querySelectorAll(`.${LAYER_CLASS}`)) {
      if (!active.has(layer)) layer.remove();
    }
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(render);
  }

  async function reloadSettings() {
    settings = await whLoadSettings();
    scheduleRender();
  }

  chrome.storage.onChanged.addListener(reloadSettings);
  new MutationObserver(scheduleRender).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", scheduleRender);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", scheduleRender);
  reloadSettings();
})();
