// Vice City Cover Studio — cover rendering engine.
// Draws the multi-panel layouts, the five colour grades, the lettering
// (title block with halftone, badge ribbon and stars), grain and vignette,
// plus the full-resolution export renderer. No network use: everything is
// drawn from images and fonts already on the machine.

export const LAYOUTS = ['hero-three', 'four-grid', 'full-bleed', 'tilted'];

export const GRADES = {
  sunset: { label: 'Sunset — orange over pink', filter: 'saturate(1.25) contrast(1.08) brightness(1.03)', top: '#ff7a18', bottom: '#ff2e88', alpha: 0.26, blend: 'overlay' },
  neon: { label: 'Neon Night — pink over teal', filter: 'saturate(1.35) contrast(1.12)', top: '#ff2e88', bottom: '#00e5c7', alpha: 0.28, blend: 'overlay' },
  teal: { label: 'Teal Heat — teal over orange', filter: 'saturate(1.2) contrast(1.1)', top: '#00b8a9', bottom: '#ff7a18', alpha: 0.26, blend: 'overlay' },
  rose: { label: 'Rose Gold — warm pink over gold', filter: 'saturate(1.2) contrast(1.05) brightness(1.05)', top: '#ff8fb3', bottom: '#ffb347', alpha: 0.24, blend: 'overlay' },
  mono: { label: 'Mono Noir — high-contrast black and white', filter: 'grayscale(1) contrast(1.3) brightness(1.05)', top: '#ffd9a0', bottom: '#000000', alpha: 0.1, blend: 'overlay' },
};

export function panelCount(layout) {
  if (layout === 'full-bleed') return 1;
  if (layout === 'tilted') return 3;
  return 4;
}

// Panel rectangles for a cover of size w x h. Each entry: {x, y, w, h, rot}
export function panelRects(layout, w, h) {
  const g = Math.round(w * 0.016);
  if (layout === 'hero-three') {
    const heroH = Math.round(h * 0.58);
    const bw = (w - g * 4) / 3;
    const by = heroH + g * 2;
    const bh = h - by - g;
    return [
      { x: g, y: g, w: w - g * 2, h: heroH, rot: 0 },
      { x: g, y: by, w: bw, h: bh, rot: 0 },
      { x: g * 2 + bw, y: by, w: bw, h: bh, rot: 0 },
      { x: g * 3 + bw * 2, y: by, w: bw, h: bh, rot: 0 },
    ];
  }
  if (layout === 'four-grid') {
    const cw = (w - g * 3) / 2;
    const ch = (h - g * 3) / 2;
    return [
      { x: g, y: g, w: cw, h: ch, rot: 0 },
      { x: g * 2 + cw, y: g, w: cw, h: ch, rot: 0 },
      { x: g, y: g * 2 + ch, w: cw, h: ch, rot: 0 },
      { x: g * 2 + cw, y: g * 2 + ch, w: cw, h: ch, rot: 0 },
    ];
  }
  if (layout === 'full-bleed') {
    return [{ x: 0, y: 0, w, h, rot: 0 }];
  }
  // tilted: three snapshots scattered over a gradient backdrop.
  const pw = w * 0.52;
  const ph = h * 0.42;
  return [
    { x: w * 0.05, y: h * 0.24, w: pw, h: ph, rot: -0.1 },
    { x: w * 0.43, y: h * 0.2, w: pw, h: ph, rot: 0.07 },
    { x: w * 0.24, y: h * 0.52, w: pw, h: ph, rot: -0.04 },
  ];
}

// Title-block band rectangle for a layout.
export function titleRect(layout, w, h) {
  if (layout === 'tilted') return { x: w * 0.06, y: h * 0.03, w: w * 0.88, h: h * 0.15 };
  if (layout === 'full-bleed') return { x: 0, y: h * 0.7, w, h: h * 0.24 };
  return { x: 0, y: h - h * 0.2, w, h: h * 0.2 };
}

function drawPhoto(ctx, img, rect, panel, grade) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = panel.zoom || 1;
  let dw; let dh;
  if (panel.fit === 'fit') {
    const s = Math.min(rect.w / iw, rect.h / ih) * zoom;
    dw = iw * s; dh = ih * s;
  } else {
    const s = Math.max(rect.w / iw, rect.h / ih) * zoom;
    dw = iw * s; dh = ih * s;
  }
  const ox = panel.ox ?? 0.5;
  const oy = panel.oy ?? 0.5;
  const cx = rect.x + rect.w / 2 + (ox - 0.5) * Math.max(0, dw - rect.w);
  const cy = rect.y + rect.h / 2 + (oy - 0.5) * Math.max(0, dh - rect.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = '#14101f';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.filter = grade.filter;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.filter = 'none';
  // Translucent colour wash over the photo.
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.globalCompositeOperation = grade.blend;
  ctx.globalAlpha = grade.alpha;
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function emptyPanel(ctx, rect, i) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const bg = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  bg.addColorStop(0, '#241a3d');
  bg.addColorStop(1, '#120e20');
  ctx.fillStyle = bg;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = '#8d82ad';
  ctx.font = `${Math.max(14, Math.round(rect.w * 0.05))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Add photo ${i + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.restore();
}

let noiseCanvas = null;
function noisePattern(ctx) {
  if (!noiseCanvas) {
    noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 128;
    noiseCanvas.height = 128;
    const nctx = noiseCanvas.getContext('2d');
    const data = nctx.createImageData(128, 128);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 255;
    }
    nctx.putImageData(data, 0, 0);
  }
  return ctx.createPattern(noiseCanvas, 'repeat');
}

function drawHalftone(ctx, rect) {
  const step = Math.max(9, Math.round(rect.w * 0.016));
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  for (let y = rect.y + step / 2; y < rect.y + rect.h; y += step) {
    for (let x = rect.x + step / 2; x < rect.x + rect.w; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, step * 0.09), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawTitleBlock(ctx, w, h, state) {
  const rect = titleRect(state.layout, w, h);
  const pad = Math.round(w * 0.03);
  ctx.save();
  // Dark band so the lettering stays readable over any photo.
  ctx.fillStyle = 'rgba(8, 5, 18, 0.82)';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  drawHalftone(ctx, rect);
  const cx = rect.x + rect.w / 2;
  const titleSize = Math.round(rect.h * 0.44);
  const subSize = Math.round(rect.h * 0.2);
  // Title: bold condensed display face, thick dark outline, soft shadow.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${titleSize}px Anton, "Arial Narrow", sans-serif`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = Math.round(titleSize * 0.12);
  ctx.shadowOffsetY = Math.round(titleSize * 0.06);
  ctx.lineWidth = Math.max(2, Math.round(titleSize * 0.1));
  ctx.strokeStyle = '#12081f';
  ctx.lineJoin = 'round';
  const ty = rect.y + rect.h * 0.34;
  ctx.strokeText(state.title || 'VICE CITY', cx, ty);
  const grad = ctx.createLinearGradient(cx - rect.w / 2, ty, cx + rect.w / 2, ty);
  grad.addColorStop(0, '#ffb347');
  grad.addColorStop(0.5, '#ffffff');
  grad.addColorStop(1, '#ff7ad9');
  ctx.fillStyle = grad;
  ctx.fillText(state.title || 'VICE CITY', cx, ty);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  // Thin rule between title and subtitle.
  const ruleY = rect.y + rect.h * 0.6;
  ctx.strokeStyle = 'rgba(0, 229, 199, 0.9)';
  ctx.lineWidth = Math.max(1, Math.round(h * 0.002));
  ctx.beginPath();
  ctx.moveTo(cx - rect.w * 0.2, ruleY);
  ctx.lineTo(cx + rect.w * 0.2, ruleY);
  ctx.stroke();
  // Subtitle: flowing neon script, faint glow.
  ctx.font = `${subSize}px Pacifico, cursive`;
  ctx.shadowColor = 'rgba(255, 46, 136, 0.8)';
  ctx.shadowBlur = Math.round(subSize * 0.45);
  ctx.fillStyle = '#ffe9f4';
  ctx.fillText(state.subtitle || '', cx, rect.y + rect.h * 0.76);
  ctx.shadowBlur = 0;
  // Badge ribbon with an invented label, top-left of the band.
  const badge = 'VICE CITY STORIES';
  ctx.font = `bold ${Math.max(10, Math.round(rect.h * 0.11))}px system-ui, sans-serif`;
  const bw = ctx.measureText(badge).width + pad;
  const bh = Math.round(rect.h * 0.2);
  const bx = rect.x + pad;
  const by = rect.y + pad * 0.5;
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + bw, by);
  ctx.lineTo(bx + bw - bh * 0.5, by + bh);
  ctx.lineTo(bx, by + bh);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText(badge, bx + pad * 0.5, by + bh / 2);
  // Row of small stars, top-right of the band.
  ctx.fillStyle = '#ffb347';
  const sr = Math.max(4, Math.round(rect.h * 0.07));
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, rect.x + rect.w - pad - sr - i * sr * 2.4, by + bh / 2, sr);
  }
  ctx.restore();
}

function drawGrain(ctx, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = noisePattern(ctx);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const r = Math.hypot(w, h) / 2;
  const v = ctx.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.save();
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Draws the whole cover onto ctx at size w x h from the editor state.
export function drawCover(ctx, w, h, state) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  if (state.layout === 'tilted') {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#2a0f3d');
    bg.addColorStop(0.55, '#3d1040');
    bg.addColorStop(1, '#0f2a2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = '#0c0a14';
    ctx.fillRect(0, 0, w, h);
  }
  const rects = panelRects(state.layout, w, h);
  const count = panelCount(state.layout);
  for (let i = 0; i < count; i++) {
    const rect = rects[i];
    const panel = state.panels[i] || {};
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      // White snapshot border under the photo.
      ctx.fillStyle = '#f5f0e6';
      ctx.fillRect(-8, -8, rect.w + 16, rect.h + 26);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      ctx.fillRect(-8, -8, rect.w + 16, rect.h + 26);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }
    const local = { x: 0, y: 0, w: rect.w, h: rect.h };
    if (panel.img) drawPhoto(ctx, panel.img, local, panel, grade);
    else emptyPanel(ctx, local, i);
    ctx.restore();
  }
  drawTitleBlock(ctx, w, h, state);
  if (state.grain !== false) drawGrain(ctx, w, h);
  if (state.vignette !== false) drawVignette(ctx, w, h);
  ctx.restore();
}

// Full-resolution export: returns a canvas of exactly w x h.
export function exportCover(state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas.getContext('2d'), w, h, state);
  return canvas;
}
