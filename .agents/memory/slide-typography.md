---
name: Slide deck typography floor
description: Text-size rules for slides artifacts so they stay readable in the fixed 1920x1080 export.
---

Slides artifacts render every slide into a fixed 1920x1080 frame for the `/allslides`
export (thumbnails, PDF, PPTX). Text uses `vw`/`vh` so it scales with that frame.

Rule:
- Standard body/bullet/paragraph copy: ≥ 2vw (aim 2–2.5vw).
- Captions, footnotes, attributions, footer bands, eyebrow labels, table headers: ≥ 1.5vw absolute floor — nothing renders below 1.5vw.
- Recharts (and any inline SVG) text uses numeric `fontSize` in px, which maps 1:1 to the 1920-wide export. Size it against 1920: 1.5vw ≈ 30px floor, 2vw ≈ 38–40px for prominent value labels. Do not leave recharts ticks/labels at small defaults (e.g. 22/26px ≈ 1.15/1.35vw) — they fall below the floor.

**Why:** The dev preview is often taller/wider than 1080p, so undersized text looks fine in preview but is illegible at export size; the visual_qa checklist fails the whole deck if any text is below 1.5vw.

**How to apply:** After building or editing slides, tally `text-[Nvw]` values (`rg -o 'text-\[[0-9.]+vw\]'`) and grep recharts `fontSize`; raise anything under the floor, then re-screenshot dense slides to confirm the bump didn't cause overflow.
