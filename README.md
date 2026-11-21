# Vice City Cover Studio

Turn your own photos and a caption into GTA-style multi-panel poster cover
art, exported as a PNG to share. All art, lettering and fonts are the
maker's own — nothing here shows a Rockstar Games logo, official artwork,
character or font.

## What it does

- **Four layouts**: Hero and Three (one big hero panel over three small
  ones), Four Grid, Full Bleed, and Tilted Snapshots (three rotated photos
  scattered over a gradient backdrop).
- **Five colour grades**: Sunset (orange over pink), Neon Night (pink over
  teal), Teal Heat, Rose Gold and Mono Noir. Each grade is a canvas
  treatment — a colour wash over the photo, shifted warmth and contrast,
  plus fine grain and a darkened vignette at the corners.
- **Lettering**: a bold condensed display face for the title (Anton) and a
  flowing neon script for the subtitle (Pacifico), both vendored under the
  SIL Open Font License. The title gets a thick dark outline and a soft drop
  shadow; the subtitle glows. The title block is a band with a halftone-dot
  field behind it, a thin rule, a badge ribbon and a row of stars.
- **Any photo**: pick a photo per panel from your machine, reuse one photo
  across several panels, click a panel to select it, drag to pan, zoom with
  the slider, and switch fill/fit. Two bundled sample photos load with one
  click so you can try it instantly.
- **Fast and easy**: a few steps from a photo to an exported PNG.

## How to run it

```sh
node serve.ts
```

Then open <http://localhost:8080> in a browser.

## How to use it

1. Click **Try pier photo** or **Try boulevard photo** to load a sample, or
   pick your own photo for each panel.
2. Choose a layout and a colour grade.
3. Type a title and a subtitle.
4. Click a panel in the preview to select it, drag to pan the photo, and
   use the zoom slider. Toggle grain and vignette on or off.
5. Click an export button to download your cover as a PNG.

Your photos never leave your machine — everything is drawn locally in the
browser, with no network requests at all.

## Export sizes

- 1080 × 1080 (square post)
- 1080 × 1350 (portrait post)
- 1920 × 1080 (landscape post)

## Fonts and licenses

- **Anton** (title) — Copyright 2020 The Anton Project Authors, licensed
  under the SIL Open Font License, Version 1.1. See
  `app/fonts/OFL-Anton.txt`.
- **Pacifico** (subtitle) — Copyright 2018 The Pacifico Project Authors,
  licensed under the SIL Open Font License, Version 1.1. See
  `app/fonts/OFL-Pacifico.txt`.

Both fonts were downloaded from the google/fonts repository. The bundled
sample photos were made with an image model and are free to use. All cover
art, lettering and code in this entry are original work.
