// Vice City Cover Studio — editor wiring: file pickers, controls, live
// preview, export buttons and shot-scene handling. All work happens locally;
// no request ever leaves the machine.

import { drawCover, exportCover, GRADES, panelCount, panelRects } from './cover.js';
import { readSceneParams, stageScene } from './shots.js';

const SAMPLES = { pier: 'samples/pier.jpg', boulevard: 'samples/boulevard.jpg' };

const state = {
  layout: 'hero-three',
  grade: 'sunset',
  title: 'VICE CITY',
  subtitle: 'sunset over the bay',
  panels: [
    { img: null, zoom: 1, fit: 'fill', ox: 0.5, oy: 0.5, name: '' },
    { img: null, zoom: 1, fit: 'fill', ox: 0.5, oy: 0.5, name: '' },
    { img: null, zoom: 1, fit: 'fill', ox: 0.5, oy: 0.5, name: '' },
    { img: null, zoom: 1, fit: 'fill', ox: 0.5, oy: 0.5, name: '' },
  ],
  grain: true,
  vignette: true,
};

let selected = 0;
let fontsReady = false;

const $ = (s) => document.querySelector(s);
const preview = $('#preview');
const coverCanvas = $('#coverCanvas');

async function loadFonts() {
  try {
    // Bundled fonts removed: system font stacks are used instead.
    await Promise.resolve();
    fontsReady = true;
  } catch (e) {
    // Fallback faces still render; the cover stays usable.
    fontsReady = false;
  }
}

function renderPreview() {
  const ctx = preview.getContext('2d');
  drawCover(ctx, preview.width, preview.height, state);
}

function renderCover() {
  const ctx = coverCanvas.getContext('2d');
  drawCover(ctx, coverCanvas.width, coverCanvas.height, state);
}

function markReady() {
  document.documentElement.dataset.sceneReady = 'true';
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + src));
    img.src = src;
  });
}

function assignPhoto(img, name, onlySelected) {
  if (onlySelected) {
    state.panels[selected].img = img;
    state.panels[selected].name = name;
  } else {
    for (const p of state.panels) { p.img = img; p.name = name; }
  }
  refreshPickers();
  renderPreview();
}

async function loadSamplePhoto(name, done) {
  try {
    const img = await loadImage(SAMPLES[name]);
    assignPhoto(img, name + '.jpg', false);
  } catch (e) { /* sample missing: leave panels empty */ }
  if (done) done();
}

function refreshPickers() {
  document.querySelectorAll('.picker').forEach((el) => {
    const i = Number(el.dataset.panel);
    const p = state.panels[i];
    el.classList.toggle('selected', i === selected);
    el.querySelector('.fname').textContent = p.img ? (p.name || 'photo loaded') : 'no photo yet';
  });
  const note = $('#selectedNote');
  if (note) note.textContent = `Panel ${selected + 1} selected — click a panel in the preview, then drag to pan.`;
  const zoom = $('#zoomRange');
  if (zoom) zoom.value = String(state.panels[selected].zoom || 1);
  const fit = $('#fitToggle');
  if (fit) {
    fit.textContent = state.panels[selected].fit === 'fit' ? 'Fit' : 'Fill';
    fit.classList.toggle('active', state.panels[selected].fit === 'fill');
  }
}

function applyState() {
  document.querySelectorAll('#layoutRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradeRow .swatch').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  const gradeName = $('#gradeName');
  if (gradeName && GRADES[state.grade]) gradeName.textContent = GRADES[state.grade].label;
  const t = $('#titleInput');
  if (t && t.value !== state.title) t.value = state.title;
  const s = $('#subtitleInput');
  if (s && s.value !== state.subtitle) s.value = state.subtitle;
  refreshPickers();
}

function showCover(w, h) {
  $('#editorView').hidden = true;
  document.querySelector('.topbar').style.display = 'none';
  const view = $('#coverView');
  view.hidden = false;
  coverCanvas.width = Math.max(240, Math.min(1920, w));
  coverCanvas.height = Math.max(240, Math.min(1920, h));
}

async function exportPNG(label) {
  const [w, h] = label.split('x').map(Number);
  const canvas = exportCover(state, w, h);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return { w, h, blob };
}

function downloadExport(label) {
  exportPNG(label).then(({ blob }) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${label}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
}

function wireControls() {
  document.querySelectorAll('#layoutRow button').forEach((b) => {
    b.addEventListener('click', () => { state.layout = b.dataset.layout; applyState(); renderPreview(); });
  });
  document.querySelectorAll('#gradeRow .swatch').forEach((b) => {
    b.addEventListener('click', () => { state.grade = b.dataset.grade; applyState(); renderPreview(); });
  });
  $('#titleInput').addEventListener('input', (e) => { state.title = e.target.value; renderPreview(); });
  $('#subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; renderPreview(); });
  document.querySelectorAll('[data-panel-input]').forEach((input) => {
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        const i = Number(input.dataset.panelInput);
        selected = i;
        state.panels[i].img = img;
        state.panels[i].name = file.name;
        refreshPickers();
        renderPreview();
      } finally { setTimeout(() => URL.revokeObjectURL(url), 10000); }
    });
  });
  document.querySelectorAll('.picker').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;
      selected = Number(el.dataset.panel);
      refreshPickers();
    });
  });
  $('#samplePier').addEventListener('click', () => loadSamplePhoto('pier'));
  $('#sampleBoulevard').addEventListener('click', () => loadSamplePhoto('boulevard'));
  $('#zoomRange').addEventListener('input', (e) => {
    state.panels[selected].zoom = Number(e.target.value);
    renderPreview();
  });
  $('#fitToggle').addEventListener('click', () => {
    const p = state.panels[selected];
    p.fit = p.fit === 'fit' ? 'fill' : 'fit';
    refreshPickers();
    renderPreview();
  });
  $('#grainToggle').addEventListener('change', (e) => { state.grain = e.target.checked; renderPreview(); });
  $('#vignetteToggle').addEventListener('change', (e) => { state.vignette = e.target.checked; renderPreview(); });
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', () => downloadExport(b.dataset.export));
  });
}

// Click a panel to select it; drag to pan its photo.
function wirePreviewDrag() {
  let dragging = false;
  let lastX = 0; let lastY = 0;
  function panelAt(clientX, clientY) {
    const r = preview.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * preview.width;
    const y = ((clientY - r.top) / r.height) * preview.height;
    const rects = panelRects(state.layout, preview.width, preview.height);
    const count = panelCount(state.layout);
    for (let i = count - 1; i >= 0; i--) {
      const rc = rects[i];
      if (x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h) return i;
    }
    return 0;
  }
  preview.addEventListener('pointerdown', (e) => {
    selected = panelAt(e.clientX, e.clientY);
    refreshPickers();
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = preview.getBoundingClientRect();
    const p = state.panels[selected];
    const dx = ((e.clientX - lastX) / r.width) * preview.width;
    const dy = ((e.clientY - lastY) / r.height) * preview.height;
    const rects = panelRects(state.layout, preview.width, preview.height);
    const rc = rects[selected];
    p.ox = Math.min(1, Math.max(0, (p.ox ?? 0.5) + dx / Math.max(1, rc.w)));
    p.oy = Math.min(1, Math.max(0, (p.oy ?? 0.5) + dy / Math.max(1, rc.h)));
    lastX = e.clientX; lastY = e.clientY;
    renderPreview();
  });
  preview.addEventListener('pointerup', () => { dragging = false; });
  preview.addEventListener('pointercancel', () => { dragging = false; });
}

// Test and tooling hook: state inspection and programmatic export.
window.__viceCity = { state, exportPNG, renderPreview, fontsReady: () => fontsReady };

async function boot() {
  wireControls();
  wirePreviewDrag();
  applyState();
  await loadFonts();
  renderPreview();
  const params = readSceneParams();
  const staged = stageScene(params, {
    state, applyState, loadSamplePhoto, showCover, renderCover, renderPreview, markReady,
  });
  if (!staged) markReady();
}
boot();
