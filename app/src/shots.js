// Vice City Cover Studio — shot-scene helper.
// Reads query parameters so a screenshot run can stage a scene without
// clicking: a full cover scene, or the editor with a sample photo and a
// caption already set.
//
// Parameters (all optional):
//   scene=cover|editor   which view to show (default editor)
//   photo=pier|boulevard bundled sample to load (default pier)
//   layout=hero-three|four-grid|full-bleed|tilted
//   grade=sunset|neon|teal|rose|mono
//   title=...            cover title
//   subtitle=...         cover subtitle

import { GRADES, LAYOUTS } from "./cover.js";

const SAMPLES = ["pier", "boulevard"];

export function readShotParams() {
  const q = new URLSearchParams(window.location.search);
  const pick = (key, allowed, fallback) => {
    const v = q.get(key);
    return v && allowed.includes(v) ? v : fallback;
  };
  return {
    scene: pick("scene", ["cover", "editor"], "editor"),
    photo: pick("photo", SAMPLES, "pier"),
    layout: pick("layout", Object.keys(LAYOUTS), "hero-three"),
    grade: pick("grade", Object.keys(GRADES), "sunset"),
    title: q.get("title"),
    subtitle: q.get("subtitle"),
  };
}

export function loadSampleImage(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`sample photo not found: ${name}`));
    img.src = `./samples/${name}.jpg`;
  });
}

// Apply the staged scene to the editor state. loadIntoPanels is called with
// the loaded sample image so the caller decides which panels it fills.
// Resolves when fonts and the sample photo are ready to draw.
export async function stageScene(state, loadIntoPanels) {
  const params = readShotParams();
  state.layout = params.layout;
  state.grade = params.grade;
  if (params.title) state.title = params.title.slice(0, 24);
  if (params.subtitle) state.subtitle = params.subtitle.slice(0, 48);

  const jobs = [loadSampleImage(params.photo)];
  try {
    await document.fonts.load('80px Anton');
    await document.fonts.load('40px Pacifico');
  } catch (err) {
    // Canvas falls back to system fonts if a vendored font fails to load.
    console.warn("font load failed, using fallback", err);
  }
  const [img] = await Promise.all(jobs);
  loadIntoPanels(img);
  document.documentElement.dataset.scene = params.scene;
  document.documentElement.dataset.sceneReady = "true";
  return params;
}
