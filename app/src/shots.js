// Vice City Cover Studio — shot-scene helper.
// Reads the page's query parameters and stages a scene without clicking:
// a cover scene draws a full cover from a sample photo, caption, layout and
// grade; an editor scene opens the editor with a sample photo already loaded
// and a caption already set. Parameter names:
//   scene=cover|editor, photo=pier|boulevard, layout=hero-three|four-grid|
//   full-bleed|tilted, grade=sunset|neon|teal|rose|mono,
//   title=..., subtitle=..., w=..., h=... (cover canvas size).

export function readSceneParams() {
  const q = new URLSearchParams(window.location.search);
  return {
    scene: q.get('scene') || '',
    photo: q.get('photo') || '',
    layout: q.get('layout') || '',
    grade: q.get('grade') || '',
    title: q.get('title') || '',
    subtitle: q.get('subtitle') || '',
    w: Number(q.get('w') || 0) || 0,
    h: Number(q.get('h') || 0) || 0,
  };
}

// Applies the scene parameters to the editor state. Returns 'cover' when a
// cover scene was staged, 'editor' for an editor scene, '' for none.
export function stageScene(params, deps) {
  const { state, applyState, loadSamplePhoto, showCover, renderCover, renderPreview, markReady } = deps;
  if (params.layout) state.layout = params.layout;
  if (params.grade) state.grade = params.grade;
  if (params.title) state.title = params.title;
  if (params.subtitle) state.subtitle = params.subtitle;
  applyState();
  if (!params.scene) return '';
  if (params.scene === 'cover') {
    const finish = () => {
      showCover(params.w || 1080, params.h || 1080);
      renderCover();
      markReady();
    };
    if (params.photo) loadSamplePhoto(params.photo, finish);
    else finish();
    return 'cover';
  }
  // Editor scene: photo already loaded, caption already set.
  const finishEditor = () => { renderPreview(); markReady(); };
  if (params.photo) loadSamplePhoto(params.photo, finishEditor);
  else finishEditor();
  return 'editor';
}
