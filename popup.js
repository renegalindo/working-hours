// Rows run Monday → Sunday; storage is indexed Sunday = 0, like Date#getDay().
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const STEP = 30;
const DAY_NAMES = Array.from({ length: 7 }, (_, i) =>
  new Date(2024, 0, 7 + i).toLocaleDateString(undefined, { weekday: "long" }),
);

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
function formatMinutes(minutes) {
  if (minutes === 1440) return "Midnight";
  return timeFormat.format(new Date(2024, 0, 1, Math.floor(minutes / 60), minutes % 60));
}

function fillOptions(select, from, to) {
  for (let m = from; m <= to; m += STEP) select.add(new Option(formatMinutes(m), m));
}

let settings;
let intensitySaveTimer;

function save() {
  whSaveSettings(settings);
}

function paintSwatch() {
  const rgb = whShadeRgb(settings.color, true); // the popup is always dark
  const alpha = 0.05 + 0.4 * (settings.intensity / 100);
  document.documentElement.style.setProperty("--stripe", `rgba(${rgb}, ${alpha})`);
}

function renderRow(row, day) {
  row.classList.toggle("off", !day.on);
  row.querySelector(".on").checked = day.on;
  row.querySelector(".start").value = day.start;
  row.querySelector(".end").value = day.end;
}

function buildRows() {
  const list = document.getElementById("days");
  const template = document.getElementById("day-row");

  for (const index of DISPLAY_ORDER) {
    const row = template.content.firstElementChild.cloneNode(true);
    const start = row.querySelector(".start");
    const end = row.querySelector(".end");
    row.dataset.index = index;
    row.querySelector(".name").textContent = DAY_NAMES[index];
    fillOptions(start, 0, 1440 - STEP);
    fillOptions(end, STEP, 1440);

    row.querySelector(".on").addEventListener("change", (e) => {
      settings.days[index].on = e.target.checked;
      renderRow(row, settings.days[index]);
      save();
    });

    // Keep every range valid: moving one end past the other drags the other along.
    start.addEventListener("change", () => {
      const day = settings.days[index];
      day.start = Number(start.value);
      if (day.end <= day.start) day.end = Math.min(day.start + 60, 1440);
      renderRow(row, day);
      save();
    });
    end.addEventListener("change", () => {
      const day = settings.days[index];
      day.end = Number(end.value);
      if (day.start >= day.end) day.start = Math.max(day.end - 60, 0);
      renderRow(row, day);
      save();
    });

    renderRow(row, settings.days[index]);
    list.append(row);
  }
}

function renderAll() {
  for (const row of document.querySelectorAll(".day")) {
    renderRow(row, settings.days[row.dataset.index]);
  }
}

async function init() {
  settings = await whLoadSettings();
  // Snap any times saved under an older, finer step onto the current one.
  const snap = (m) => Math.round(m / STEP) * STEP;
  const before = JSON.stringify(settings.days);
  for (const day of settings.days) {
    day.start = Math.min(snap(day.start), 1440 - STEP);
    day.end = Math.max(snap(day.end), day.start + STEP);
  }
  if (JSON.stringify(settings.days) !== before) save();

  const enabled = document.getElementById("enabled");
  const panel = document.getElementById("panel");
  const intensity = document.getElementById("intensity");

  enabled.checked = settings.enabled;
  panel.classList.toggle("paused", !settings.enabled);
  enabled.addEventListener("change", () => {
    settings.enabled = enabled.checked;
    panel.classList.toggle("paused", !settings.enabled);
    save();
  });

  intensity.value = settings.intensity;
  paintSwatch();
  intensity.addEventListener("input", () => {
    settings.intensity = Number(intensity.value);
    paintSwatch();
    // Debounced: chrome.storage.sync caps writes per minute, and a slider drag fires dozens.
    clearTimeout(intensitySaveTimer);
    intensitySaveTimer = setTimeout(save, 150);
  });

  const colors = document.getElementById("colors");
  for (const [name, value] of Object.entries(WH_COLORS)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "color";
    button.title = name[0].toUpperCase() + name.slice(1);
    button.setAttribute("aria-label", button.title);
    button.style.setProperty("--dot", `rgb(${whShadeRgb(name, true)})`);
    button.setAttribute("aria-pressed", settings.color === name);
    button.addEventListener("click", () => {
      settings.color = name;
      for (const other of colors.children) other.setAttribute("aria-pressed", other === button);
      paintSwatch();
      save();
    });
    colors.append(button);
  }

  document.getElementById("copy-monday").addEventListener("click", () => {
    for (const index of [2, 3, 4, 5]) settings.days[index] = { ...settings.days[1] };
    renderAll();
    save();
  });

  buildRows();
}

init();
