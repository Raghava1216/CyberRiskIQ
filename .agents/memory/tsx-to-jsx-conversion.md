---
name: TSX to JSX in-place conversion (Vite + TS app)
description: How to convert .tsx pages/components to plain .jsx inside a TypeScript Vite artifact without breaking the build.
---

When a user wants part of a TypeScript Vite app converted to plain JSX in place
(e.g. threat-dashboard `src/pages/*.tsx` → `*.jsx`):

- Set `"allowJs": true` in that artifact's `tsconfig.json`. Without it, the still-TS
  entry files (e.g. `App.tsx` with extensionless `./pages/X` imports) cannot resolve
  the new `.jsx` files and tsc errors on every page import.
  **Why:** TS's default module resolution only tries .ts/.tsx/.d.ts; allowJs adds .jsx/.js.
- The app keeps rendering even if `pnpm typecheck` is red, because Vite uses esbuild
  to transpile (no type-check gate). Don't treat tsc errors in *untouched* non-converted
  TS files as conversion regressions — verify with `git diff --name-only HEAD` that you
  didn't touch them, then confirm the app renders via screenshot.
  **How to apply:** after conversion, restart the artifact's workflow (Vite caches the old
  module graph and will throw stale HMR "Failed to reload X.tsx" errors mid-conversion),
  then screenshot to confirm.
- Faithful strip list: interfaces/type decls, `import type` (and `{ type X }` members),
  param/var/return annotations, hook generics (`useState<T>`→`useState`), `as`/`as const`
  casts, non-null `!`. Preserve all runtime logic, JSX, classNames, hook order, default export.
