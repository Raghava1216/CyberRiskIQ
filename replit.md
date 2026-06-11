# CyberRiskIQ

An enterprise cyber GRC platform: a threat & risk posture dashboard (web app) plus a board/industry pitch deck (slides), backed by a shared API server.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/threat-dashboard` — main GRC web app (React + Vite + React-Bootstrap).
  - `src/platform/` — the "application model" layer: `reports.ts` + `charts.ts` registries (CR_* ids → mockData), `currentUser.ts` (CR_* privileges), `format.ts`, `i18n.ts`, `pageProps.ts`, `types.ts`.
  - `src/components/reports/Report.tsx` — `ReportRuntime` (table / dataCard / pivotTable).
  - `src/components/charts/Chart.tsx` — recharts-backed `Chart` runtime.
  - `src/components/pages/` — `LandingPagesTitle`, `StatsCard`, `FormReportChartLink`, `SectionHeaderCard`.
  - `src/lib/mockData.ts` — source of all dashboard data.
  - `src/styles/platform.css` — light GRC theme.
- `artifacts/cyberriskiq-deck` — board/industry slide deck (slides artifact, export-only).
- `artifacts/api-server` — Express API server (port from `PORT`).

## Architecture decisions

- The threat-dashboard mirrors the user's in-house enterprise GRC "application model": a `Tab.Container` landing page (`LandingPagesTitle` with year filter + privilege-gated tab strip), and pages are thin Card/Row/Col compositions of `ReportRuntime report="CR_..."` and `Chart chart="CR_..."`.
- Module prefix is `CR` (mirrors their `RA`); all report/chart/privilege ids are `CR_*`.
- Reports/charts are registry-driven: add a CR_* entry to `platform/reports.ts` or `platform/charts.ts`, then reference it by id from a page — no bespoke page code.
- recharts is pinned to v2 here; the deck uses v3 (isolated per-artifact by pnpm — do not unify).

## Product

CyberRiskIQ gives security & risk teams a single posture view: risk register (FAIR / Monte Carlo), threat intel, vulnerabilities, assets, IOCs, incidents, compliance frameworks (DORA/NIS2), reports, and Wazuh SIEM telemetry — gated by CR_* role privileges.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
