// Vice City Cover Studio — editor wiring.
// File pickers, layout and grade controls, live preview, pan and zoom,
// export buttons, and shot-scene staging. All local: photos are read with
// object URLs and never uploaded anywhere.

import { GRADES, LAYOUTS, EXPORT_SIZES, layoutPanels, renderCover, renderExport } from "./cover.js";
import { readShotParams, loadSampleImage, stageScene } from "./shots.js";

const $ = (sel) => document.querySelector(sel);

const state = {
  layout: "hero-three",
  grade: "sunset",
  title: "VICE CITY",
  subtitle: "sunset over the bay",
  grain: true,
  vignette: true,
  panels: [],
  selected: 0,
};

let previewSize = { w: 1920, h: 1080 };

function freshPanels(n, keep) {
  const next = [];
  for (let i = 0; i < n; i++) {
    next.push(keep && keep[i] ? keep[i] : { img: null, zoom: 1, ox: 0, oy: 0, fit: "cover" });
  }
  return next;
}

function ensurePanels() {
  const n = LAYOUTS[state.layout].panels;
  state.panels = freshPanels(n, state.panels);
  if (state.selected >= n) state.selected = 0;
}

function buildLayoutButtons() {
  const box = $("#layoutButtons");
  box.innerHTML = "";
  for (const [key, def] of Object.entries(LAYOUTS)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "layout-btn" + (key === state.layout ? " active" : "");
    btn.textContent = def.name;
    btn.dataset.layout = key;
    btn.addEventListener("click", () => {
      state.layout = key;
      ensurePanels();
      buildLayoutButtons();
      buildPickers();
      syncSelectedControls();
      renderPreview();
    });
    box.appendChild(btn);
  }
}

function buildGradeButtons() {
  const box = $("#gradeButtons");
  box.innerHTML = "";
  for (const [key, def] of Object.entries(GRADES)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "grade-btn" + (key === state.grade ? " active" : "");
    btn.dataset.grade = key;
    const dot = document.createElement("span");
    dot.className = "grade-dot";
    dot.style.background = def.swatch;
    btn.appendChild(dot);
    btn.appendChild(document.createTextNode(def.name));
    btn.addEventListener("click", () => {
      state.grade = key;
      buildGradeButtons();
      renderPreview();
    });
    box.appendChild(btn);
  }
}

function buildPickers() {
  const box = $("#pickers");
  box.innerHTML = "";
  ensurePanels();
  state.panels.forEach((panel, i) => {
    const row = document.createElement("div");
    row.className = "picker-row" + (i === state.selected ? " selected" : "");
    row.addEventListener("click", () => {
      state.selected = i;
      buildPickers();
      syncSelectedControls();
      renderPreview();
    });

    const thumb = document.createElement("img");
    thumb.className = "thumb";
    thumb.alt = "";
    if (panel.img) thumb.src = panel.img.src;
    row.appendChild(thumb);

    const label = document.createElement("span");
    label.className = "picker-label";
    label.textContent = `Panel ${i + 1}`;
    const sub = document.createElement("small");
    sub.textContent = panel.img ? "photo loaded — click to select" : "empty — choose a photo";
    label.appendChild(sub);
    row.appendChild(label);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "picker-btn";
    btn.textContent = "Choose photo";
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openFilePicker(i);
    });
    row.appendChild(btn);
    box.appendChild(row);
  });
}

function openFilePicker(index) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      state.panels[index].img = img;
      state.panels[index].zoom = 1;
      state.panels[index].ox = 0;
      state.panels[index].oy = 0;
      state.selected = index;
      buildPickers();
      syncSelectedControls();
      renderPreview();
    };
    img.src = url;
  });
  input.click();
}

function loadSampleIntoAll(img) {
  ensurePanels();
  state.panels.forEach((p) => {
    p.img = img;
    p.zoom = 1;
    p.ox = 0;
    p.oy = 0;
  });
}

function syncSelectedControls() {
  const panel = state.panels[state.selected];
  if (!panel) return;
  const zoom = $("#zoomSlider");
  zoom.value = String(panel.zoom);
  $("#zoomValue").textContent = `${panel.zoom.toFixed(2)}×`;
  const fit = $("#fitToggle");
  fit.textContent = panel.fit === "cover" ? "Fill panel" : "Fit panel";
  fit.setAttribute("aria-pressed", String(panel.fit === "cover"));
}

function renderPreview() {
  const canvas = $("#preview");
  const scale = 960 / previewSize.w;
  canvas.width = 960;
  canvas.height = Math.round(previewSize.h * scale);
  renderCover(canvas.getContext("2d"), state, canvas.width, canvas.height);
}

// Hit-test the preview canvas: which panel is under cover point (x, y)?
function panelAt(x, y) {
  const { panels } = layoutPanels(state.layout, $("#preview").width, $("#preview").height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const r = panels[i];
    let px = x;
    let py = y;
    if (r.rot) {
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const dx = x - cx;
      const dy = y - cy;
      const cos = Math.cos(-r.rot);
      const sin = Math.sin(-r.rot);
      px = cx + dx * cos - dy * sin;
      py = cy + dx * sin + dy * cos;
    }
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

function wireCanvasDrag() {
  const canvas = $("#preview");
  let drag = null;
  canvas.addEventListener("pointerdown", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const x = (ev.clientX - rect.left) * sx;
    const y = (ev.clientY - rect.top) * sx;
    const hit = panelAt(x, y);
    if (hit < 0) return;
    state.selected = hit;
    buildPickers();
    syncSelectedControls();
    renderPreview();
    canvas.setPointerCapture(ev.pointerId);
    drag = { x: ev.clientX, y: ev.clientY, ox: state.panels[hit].ox, oy: state.panels[hit].oy, sx };
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (!drag) return;
    const panel = state.panels[state.selected];
    panel.ox = drag.ox + (ev.clientX - drag.x) * drag.sx;
    panel.oy = drag.oy + (ev.clientY - drag.y) * drag.sx;
    renderPreview();
  });
  const end = () => { drag = null; };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
}

function wireControls() {
  $("#titleInput").addEventListener("input", (ev) => {
    state.title = ev.target.value;
    renderPreview();
  });
  $("#subtitleInput").addEventListener("input", (ev) => {
    state.subtitle = ev.target.value;
    renderPreview();
  });

  $("#zoomSlider").addEventListener("input", (ev) => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = parseFloat(ev.target.value);
    $("#zoomValue").textContent = `${panel.zoom.toFixed(2)}×`;
    renderPreview();
  });

  $("#fitToggle").addEventListener("click", () => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.fit = panel.fit === "cover" ? "contain" : "cover";
    syncSelectedControls();
    renderPreview();
  });

  const bindToggle = (id, key) => {
    $(id).addEventListener("click", (ev) => {
      state[key] = !state[key];
      ev.currentTarget.classList.toggle("on", state[key]);
      ev.currentTarget.setAttribute("aria-pressed", String(state[key]));
      renderPreview();
    });
  };
  bindToggle("#grainToggle", "grain");
  bindToggle("#vignetteToggle", "vignette");

  document.querySelectorAll(".sample-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        const img = await loadSampleImage(btn.dataset.sample.replace(/\.jpg$/, ""));
        loadSampleIntoAll(img);
        buildPickers();
        renderPreview();
      } catch (err) {
        console.warn("sample failed to load", err);
      }
    });
  });

  document.querySelectorAll("[data-export]").forEach((btn) => {
    btn.addEventListener("click", () => exportPNG(btn.dataset.export));
  });
}

// Export the cover at full resolution and download it as a PNG.
// Returns the blob so automated checks can confirm the pixel dimensions.
export async function exportPNG(label) {
  const size = EXPORT_SIZES.find((s) => s.label === label);
  if (!size) throw new Error(`unknown export size: ${label}`);
  previewSize = { w: size.w, h: size.h };
  renderPreview();
  const canvas = renderExport(state, size.w, size.h);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vice-city-cover-${size.w}x${size.h}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return { blob, w: size.w, h: size.h };
}

// Full-cover scene: hide the editor chrome and paint the cover edge to
// edge so a screenshot captures exactly the artwork.
function showCoverScene() {
  document.querySelector(".layout").hidden = true;
  document.querySelector(".topbar").hidden = true;
  document.querySelector(".stage-hint").hidden = true;
  const only = $("#coverOnly");
  only.hidden = false;
  const canvas = $("#coverCanvas");
  const draw = () => {
    const w = Math.min(window.innerWidth, 1920);
    const h = Math.round((w * window.innerHeight) / window.innerWidth);
    canvas.width = w;
    canvas.height = h;
    renderCover(canvas.getContext("2d"), state, w, h);
  };
  window.addEventListener("resize", draw);
  draw();
}

async function init() {
  ensurePanels();
  buildLayoutButtons();
  buildGradeButtons();
  buildPickers();
  syncSelectedControls();
  wireControls();
  wireCanvasDrag();

  const params = readShotParams();
  await stageScene(state, loadSampleIntoAll);

  // Reflect the staged scene in the controls and the preview.
  $("#titleInput").value = state.title;
  $("#subtitleInput").value = state.subtitle;
  buildLayoutButtons();
  buildGradeButtons();
  buildPickers();
  syncSelectedControls();

  if (params.scene === "cover") {
    showCoverScene();
  } else {
    renderPreview();
  }
}

// Handles for automated verification (used by the screenshot harness).
window.__viceCity = { state, exportPNG, renderPreview, get previewSize() { return previewSize; } };

init().catch((err) => console.error("Vice City Cover Studio failed to start", err));
