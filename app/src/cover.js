// Vice City Cover Studio — cover rendering engine.
// Draws multi-panel covers: photos, colour grades, lettering, grain,
// vignette and halftone. Pure canvas, no network, no external assets.

export const GRADES = {
  sunset: {
    name: "Sunset", top: "#ff7a18", bottom: "#ff2e88", overlay: 0.30,
    filter: "saturate(1.28) contrast(1.12) brightness(1.03)",
    swatch: "linear-gradient(135deg,#ff7a18,#ff2e88)",
  },
  neon: {
    name: "Neon Night", top: "#ff2e88", bottom: "#00e5c7", overlay: 0.32,
    filter: "saturate(1.38) contrast(1.16) brightness(1.0)",
    swatch: "linear-gradient(135deg,#ff2e88,#00e5c7)",
  },
  teal: {
    name: "Teal Heat", top: "#00c2a8", bottom: "#ff7a18", overlay: 0.30,
    filter: "saturate(1.22) contrast(1.11) brightness(1.02)",
    swatch: "linear-gradient(135deg,#00c2a8,#ff7a18)",
  },
  rose: {
    name: "Rose Gold", top: "#ff8fa3", bottom: "#ffb347", overlay: 0.28,
    filter: "saturate(1.18) contrast(1.06) brightness(1.05)",
    swatch: "linear-gradient(135deg,#ff8fa3,#ffb347)",
  },
  mono: {
    name: "Mono Noir", top: "#ffffff", bottom: "#1a1a1a", overlay: 0.10,
    filter: "grayscale(1) contrast(1.30) brightness(1.06)",
    swatch: "linear-gradient(135deg,#e8e8e8,#222222)",
  },
};

export const LAYOUTS = {
  "hero-three": { name: "Hero + Three", panels: 4 },
  "four-grid": { name: "Four Grid", panels: 4 },
  "full-bleed": { name: "Full Bleed", panels: 1 },
  tilted: { name: "Tilted Snapshots", panels: 3 },
};

export const EXPORT_SIZES = [
  { label: "1080x1080", w: 1080, h: 1080 },
  { label: "1080x1350", w: 1080, h: 1350 },
  { label: "1920x1080", w: 1920, h: 1080 },
];

// Panel rectangles (pixels) plus the title-band rectangle for a cover of
// size W x H. Title band sits at the bottom, except Tilted where it is up top.
export function layoutPanels(layout, W, H) {
  const g = Math.round(Math.min(W, H) * 0.014); // gap
  const titleH = Math.round(H * 0.155);
  const band = { x: g, y: H - titleH - g, w: W - 2 * g, h: titleH, place: "bottom" };
  const workH = H - titleH - 2 * g;
  if (layout === "hero-three") {
    const heroH = Math.round(workH * 0.60);
    const smallH = workH - heroH - g;
    const sw = Math.round((W - 2 * g - 2 * g) / 3);
    const panels = [{ x: g, y: g, w: W - 2 * g, h: heroH, rot: 0 }];
    for (let i = 0; i < 3; i++) {
      panels.push({ x: g + i * (sw + g), y: g + heroH + g, w: sw, h: smallH, rot: 0 });
    }
    return { panels, band };
  }
  if (layout === "four-grid") {
    const cw = Math.round((W - 2 * g - g) / 2);
    const ch = Math.round((workH - g) / 2);
    const panels = [];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        panels.push({ x: g + c * (cw + g), y: g + r * (ch + g), w: cw, h: ch, rot: 0 });
      }
    }
    return { panels, band };
  }
  if (layout === "full-bleed") {
    return {
      panels: [{ x: 0, y: 0, w: W, h: H, rot: 0 }],
      band: { x: g, y: Math.round(H * 0.70), w: W - 2 * g, h: Math.round(H * 0.26), place: "bottom" },
    };
  }
  // tilted: three snapshots scattered over a gradient backdrop
  const pw = Math.round(W * 0.42);
  const ph = Math.round(H * 0.44);
  return {
    panels: [
      { x: Math.round(W * 0.05), y: Math.round(H * 0.30), w: pw, h: ph, rot: -0.07 },
      { x: Math.round(W * 0.52), y: Math.round(H * 0.26), w: pw, h: ph, rot: 0.05 },
      { x: Math.round(W * 0.29), y: Math.round(H * 0.56), w: pw, h: ph, rot: -0.02 },
    ],
    band: { x: g, y: Math.round(H * 0.035), w: W - 2 * g, h: Math.round(H * 0.19), place: "top" },
  };
}

function drawImageCovered(ctx, img, rect, panel) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const rw = rect.w;
  const rh = rect.h;
  let dw, dh;
  if (panel.fit === "contain") {
    const s = Math.min(rw / iw, rh / ih) * panel.zoom;
    dw = iw * s;
    dh = ih * s;
  } else {
    const s = Math.max(rw / iw, rh / ih) * panel.zoom;
    dw = iw * s;
    dh = ih * s;
  }
  const dx = rect.x + (rw - dw) / 2 + (panel.ox || 0);
  const dy = rect.y + (rh - dh) / 2 + (panel.oy || 0);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function gradeWash(ctx, rect, grade) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, grade.top);
  grad.addColorStop(1, grade.bottom);
  ctx.save();
  ctx.globalAlpha = grade.overlay;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

let noisePattern = null;
function getNoise(ctx) {
  if (noisePattern) return noisePattern;
  const n = document.createElement("canvas");
  n.width = 160;
  n.height = 160;
  const nctx = n.getContext("2d");
  const data = nctx.createImageData(160, 160);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 64);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  nctx.putImageData(data, 0, 0);
  noisePattern = ctx.createPattern(n, "repeat");
  return noisePattern;
}

function applyGrain(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = getNoise(ctx);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function applyVignette(ctx, W, H) {
  const r = Math.hypot(W, H) / 2;
  const grad = ctx.createRadialGradient(W / 2, H / 2, r * 0.42, W / 2, H / 2, r);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.44)");
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawHalftone(ctx, rect, unit) {
  const step = Math.max(10, unit * 0.9);
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  let row = 0;
  for (let y = rect.y + step / 2; y < rect.y + rect.h; y += step, row++) {
    for (let x = rect.x + step / 2 + (row % 2 ? step / 2 : 0); x < rect.x + rect.w; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, unit * 0.11), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPlaceholder(ctx, rect, grade, index) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, "#241a3a");
  grad.addColorStop(1, "#120c20");
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  for (let x = rect.x - rect.h; x < rect.x + rect.w; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, rect.y + rect.h);
    ctx.lineTo(x + rect.h, rect.y);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `600 ${Math.max(13, rect.w * 0.035)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`Panel ${index + 1} — add a photo`, rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.restore();
}

function drawTitleBand(ctx, band, state, W) {
  const grade = GRADES[state.grade];
  const unit = W / 1920;
  const pad = Math.max(14, 26 * unit);

  // dark backing + faint halftone field behind the lettering
  ctx.save();
  ctx.fillStyle = "rgba(10, 6, 18, 0.78)";
  ctx.fillRect(band.x, band.y, band.w, band.h);
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = Math.max(1, 2 * unit);
  ctx.strokeRect(band.x, band.y, band.w, band.h);
  drawHalftone(ctx, band, Math.max(12, 22 * unit));
  ctx.restore();

  const cx = band.x + band.w / 2;
  const titleSize = Math.min(band.h * 0.46, W * 0.085);
  const subSize = Math.max(16, W * 0.028);
  const titleY = band.y + band.h * 0.30;
  const ruleY = band.y + band.h * 0.58;
  const subY = band.y + band.h * 0.80;

  // title: bold condensed display face, thick dark outline, soft shadow
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${titleSize}px Anton, "Arial Narrow", sans-serif`;
  ctx.shadowColor = "rgba(255,61,139,0.55)";
  ctx.shadowBlur = titleSize * 0.14;
  ctx.shadowOffsetY = titleSize * 0.035;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(4, titleSize * 0.13);
  ctx.strokeStyle = "#14091f";
  ctx.strokeText(state.title.toUpperCase(), cx, titleY);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(state.title.toUpperCase(), cx, titleY);
  ctx.restore();

  // thin rule between title and subtitle
  ctx.save();
  const ruleGrad = ctx.createLinearGradient(band.x + pad, 0, band.x + band.w - pad, 0);
  ruleGrad.addColorStop(0, "rgba(255,61,139,0)");
  ruleGrad.addColorStop(0.5, "#ff3d8b");
  ruleGrad.addColorStop(1, "rgba(46,230,214,0)");
  ctx.strokeStyle = ruleGrad;
  ctx.lineWidth = Math.max(1.5, 3 * unit);
  ctx.beginPath();
  ctx.moveTo(band.x + band.w * 0.18, ruleY);
  ctx.lineTo(band.x + band.w * 0.82, ruleY);
  ctx.stroke();
  ctx.restore();

  // subtitle: flowing neon script, faint glow
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${subSize}px Pacifico, cursive`;
  ctx.shadowColor = "rgba(46,230,214,0.75)";
  ctx.shadowBlur = subSize * 0.45;
  ctx.fillStyle = "#ffe9f4";
  ctx.fillText(state.subtitle, cx, subY);
  ctx.restore();

  // badge ribbon: short invented label for this grade
  const badge = `${grade.name.toUpperCase()} EDITION`;
  ctx.save();
  const bSize = Math.max(12, W * 0.013);
  ctx.font = `700 ${bSize}px system-ui, sans-serif`;
  const bw = ctx.measureText(badge).width + pad * 1.4;
  const bh = bSize * 2.1;
  const bx = band.x + band.w - bw - pad;
  const by = band.y + pad * 0.55;
  ctx.translate(bx + bw / 2, by + bh / 2);
  ctx.rotate(-0.03);
  ctx.fillStyle = "#ff3d8b";
  ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badge, 0, 1);
  ctx.restore();

  // row of small stars centred on the rule, like beads on a line
  const starR = Math.max(5, W * 0.006);
  const gap = starR * 3.4;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, cx + (i - 2) * gap, ruleY, starR, i % 2 ? "#ffd166" : "#ffffff");
  }
}

// Draw one photo panel: clip, draw the photo with the grade filter, then
// lay the translucent colour gradient over it.
function drawPanel(ctx, rect, panel, grade) {
  ctx.save();
  ctx.beginPath();
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.translate(cx, cy);
  if (rect.rot) ctx.rotate(rect.rot);
  ctx.translate(-cx, -cy);
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (panel.img) {
    ctx.filter = grade.filter;
    drawImageCovered(ctx, panel.img, rect, panel);
    ctx.filter = "none";
    gradeWash(ctx, rect, grade);
  }
  ctx.restore();
  if (rect.rot) {
    // crisp white frame so rotated snapshots read as photos on a table
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rect.rot);
    ctx.translate(-cx, -cy);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = Math.max(3, rect.w * 0.008);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
}

// Render the whole cover onto ctx at W x H from the editor state.
export function renderCover(ctx, state, W, H) {
  const grade = GRADES[state.grade];
  const { panels, band } = layoutPanels(state.layout, W, H);

  // backdrop
  const bg = ctx.createLinearGradient(0, 0, W, H);
  if (state.layout === "tilted") {
    bg.addColorStop(0, "#1b1030");
    bg.addColorStop(0.5, "#2c1544");
    bg.addColorStop(1, "#120a20");
  } else {
    bg.addColorStop(0, "#0d0916");
    bg.addColorStop(1, "#08060f");
  }
  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  panels.forEach((rect, i) => {
    const panel = state.panels[i] || { img: null, zoom: 1, ox: 0, oy: 0, fit: "cover" };
    if (panel.img) {
      drawPanel(ctx, rect, panel, grade);
    } else {
      ctx.save();
      if (rect.rot) {
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        ctx.translate(cx, cy);
        ctx.rotate(rect.rot);
        ctx.translate(-cx, -cy);
      }
      drawPlaceholder(ctx, rect, grade, i);
      ctx.restore();
    }
  });

  drawTitleBand(ctx, band, state, W);

  if (state.grain) applyGrain(ctx, W, H);
  if (state.vignette) applyVignette(ctx, W, H);
}

// Render at full export resolution and return the canvas.
export function renderExport(state, w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  renderCover(canvas.getContext("2d"), state, w, h);
  return canvas;
}

