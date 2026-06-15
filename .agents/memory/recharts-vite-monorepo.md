---
name: recharts in this pnpm monorepo
description: recharts version split across artifacts + the transient "useRef of null" dev error
---

# recharts in this monorepo

Two recharts majors coexist in the workspace, resolved per-artifact:
- `threat-dashboard` pins recharts v2 (`^2.15`).
- `cyberriskiq-deck` (slides) uses recharts v3.

**Why it matters:** they are isolated by pnpm, so this is fine — but do NOT
"unify" them blindly. v3 has breaking API/prop changes vs v2; bumping
threat-dashboard to v3 would require reworking its Chart runtime.

## Transient "Cannot read properties of null (reading 'useRef')"
During Vite dev, the first time recharts (and fontawesome) get pulled into the
dep-optimizer, you can see a one-off runtime error in the console
(`Invalid hook call` / `useRef` of null) coming from `recharts.js` in
`.vite/deps`. **It is a stale pre-bundle during optimization, not a real
duplicate-React bug.**

**How to apply:** if you see this only right after adding/optimizing deps,
restart the workflow (forces a clean optimize) and re-check — a clean load and
e2e tab navigation showed no errors. Don't chase it as a duplicate-React issue.

## Blank charts inside react-bootstrap Tab.Container
A recharts chart placed in a `Tab.Pane` can render blank (only legend, no
arcs/bars) or show partial mid-animation artifacts. Console shows
`width(-1)/height(0)` warnings from `ResponsiveContainer`.

**Why:** the default Bootstrap tab fade transition mounts the active pane while
it is still `display:none`/0-size, so `ResponsiveContainer` measures 0 and a
`Pie` whose radius derives from that never recovers after resize.

**How to apply:** set `transition={false}` on the `Tab.Container` (kills the
fade so panes mount at real size) AND `isAnimationActive={false}` on every
series (`Pie`/`Bar`/`Line`) for deterministic, screenshot-stable rendering. A
`minHeight` wrapper around the container is a cheap extra guard.
