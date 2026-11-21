# Vice City Cover Studio

Turn your own photos into GTA 6-style multi-panel poster cover art, right in
the browser — no uploads, no account, no network. Pick a layout, pick a
sunset-or-neon colour grade, write a caption, and export a share-ready PNG.

## How to run it

```sh
node serve.ts
```

Then open <http://localhost:8080> in a desktop browser. Everything is plain
static files under `app/`; the app works fully offline.

## How to use it

1. **Try a sample first.** Click **Pier sample** or **Boulevard sample** —
   two bundled photos load into every panel at once, so you can see a finished
   cover immediately.
2. **Choose a layout.** Four are built in:
   - *Hero + Three* — one large hero panel on top, three small panels below.
   - *Four Grid* — two rows of two equal panels.
   - *Full Bleed* — one photo fills the whole cover, title overlaid near the
     bottom.
   - *Tilted Snapshots* — three photo panels slightly rotated like scattered
     snapshots over a gradient backdrop, title at the top.
3. **Pick a colour grade.** Sunset, Neon Night, Teal Heat, Rose Gold, or
   Mono Noir. Each grade lays a translucent colour wash over the photos,
   shifts warmth and contrast, and finishes with film grain and a darkened
   vignette at the corners.
4. **Write the caption.** The title is set in a bold condensed display face
   with a thick dark outline and a soft drop shadow; the subtitle is a glowing
   neon script. A thin rule sits between them, with a small badge ribbon and
   a row of stars, over a faint halftone dot field.
5. **Place your photos.** Use **Choose photo** on any panel to load a photo
   from your machine — one photo can fill several panels. Click a panel in
   the preview to select it, drag it to pan, use the zoom slider, or switch
   between Fill and Fit. Grain and vignette can be toggled off.
6. **Export.** The three buttons at the top save a PNG in the size you pick.

## Export sizes

| Button | Pixels | Good for |
| ------ | ------ | -------- |
| Square | 1080 × 1080 | Feed posts |
| Portrait | 1080 × 1350 | Stories and portrait posts |
| Wide | 1920 × 1080 | Banners and wide posts |

Exports are rendered at full resolution on a canvas and downloaded as PNG
files named like `vice-city-cover-1920x1080.png`.

## Privacy

Your photos never leave your machine. The app makes no network requests at
all: the fonts, the sample photos, the scripts and the styles all live under
`app/`. Photos you pick are read with temporary local object URLs and are
never uploaded anywhere.

## Fonts

Two open-licensed fonts are vendored under `app/fonts/`, both under the SIL
Open Font License, Version 1.1 (license texts included in the same folder):

- **Anton** (regular) — the bold condensed display face used for the title.
- **Pacifico** (regular) — the flowing script face used for the subtitle.

## Original art

All artwork, lettering and sample photos in this entry are original work made
for this project. Nothing in the app shows a Rockstar Games logo, official
artwork, character, or font, and "Vice City Cover Studio" is an invented
name. The two bundled sample photos are original synthetic illustrations
made for this entry and are free to use.

## Files

- `app/index.html` — the page
- `app/style.css` — the dark editor styling with neon accents
- `app/src/cover.js` — the cover rendering engine (panels, grades,
  lettering, grain, vignette, halftone, export renderer)
- `app/src/main.js` — the editor wiring (pickers, controls, live preview,
  export buttons, shot scenes)
- `app/src/shots.js` — the shot-scene helper that stages a cover or editor
  scene from query parameters
- `app/fonts/` — Anton and Pacifico, plus their OFL license texts
- `app/samples/` — the two bundled sample photos
- `serve.ts` — tiny static file server (Node 22, standard library only)
- `shots.json` — the four screenshot scenes
- `screenshots/` — the four entry screenshots
