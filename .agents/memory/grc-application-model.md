---
name: GRC application-model conversion
description: How the threat-dashboard adopts the user's enterprise GRC shell, and why the real Report/Chart engines were not ported.
---

# GRC application-model conversion (threat-dashboard)

The threat-dashboard reproduces the user's enterprise GRC "application model": a
top-tab shell (year filter + underline tabs) over a KPI module strip and a
Forms/Reports/Charts link panel. Component/class names live in the code under
`src/components/platform/` — grep there rather than trusting names listed here.

## Why only the shell was reproduced (not the real Report/Chart)
The user's real `Report.jsx` / `Chart.jsx` are backend + platform bound (axios +
react-query + dozens of internal imports) and **cannot run standalone** in this
artifact. So only the layout/shell model was reproduced; Forms/Reports/Charts are
placeholder slots that route into existing sections. The user will swap in the real
backend-driven runtimes later — keep those slots' shapes stable.

**Why:** porting the real components would drag in an un-runnable backend graph.
**How to apply:** when extending, preserve the slot structure (LinkItem type, privilege
gating via `getCurrentUser`/`getPrivileges`) so the real engines drop in cleanly.

## Hard constraint: preserve ALL interactive features
A prior refactor was REJECTED for deleting features. Every page, modal, RiskMatrix,
AssessmentReviewPanel, and WazuhWidget must survive any re-skin. The validation gate
enforces feature/UI parity (see sandbox-git-restore.md).

## Monorepo gotcha
Root `pnpm add <pkg>` fails here — install per-artifact with
`pnpm --filter @workspace/threat-dashboard add <pkg>`.
