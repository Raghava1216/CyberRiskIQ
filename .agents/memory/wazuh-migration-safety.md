---
name: Wazuh integration migration safety
description: Error-semantics, fail-fast config, and credential-handling rules for the Wazuh proxy migrated from bolt to the Express api-server.
---

# Wazuh integration migration safety

Migrating the old standalone Node proxy (`threat-proxy.cjs` on `localhost:3001`)
into the api-server surfaced a class of bugs the completion code-review gate
blocks on. Apply these rules to any similar service-integration migration.

## Error responses must be distinguishable from success
**Rule:** never return `{ success: true }` alongside an `error` with empty data.
A route that did `ok(res, { data: [], error })` made the frontend take the
success branch, set `data = []`, then crash on `data.agents.active`.
**Why:** clients dereference nested fields on the success path; an empty-array
"success" is a landmine.
**How to apply:** use a dedicated `fail(res, error, 502)` → `{ success:false, error }`
for real failures; reserve success+empty-data only for *intentional* empty
results (e.g. permission-scoped reads that legitimately return nothing).

## Don't swallow the core connectivity probe
**Rule:** the primary auth/connectivity call (e.g. `/agents`) must NOT be wrapped
in `.catch(() => null)`. Let it propagate so the route returns `fail()`.
**Why:** swallowing it makes a broken/unauthenticated connection look "connected"
with zeroed stats. Secondary, scope-optional calls (e.g. alerts) may stay
best-effort.

## Fail fast on missing config; secure TLS by default
**Rule:** no hardcoded internal host/username/password defaults. Require env
(`WAZUH_HOST/USERNAME/PASSWORD`) via an `assertConfigured()` called in the auth
path. `rejectUnauthorized` defaults to **true**; only an explicit
`WAZUH_REJECT_UNAUTHORIZED=false` disables it (self-signed internal certs).

## Never persist credentials in the browser
**Rule:** settings forms must not write secrets to `localStorage`. Persist only
non-secret prefs (host/port/enabled); keep username/password transient in
component state, and strip any legacy secrets on load.

## Frontend reaches the api-server via `/api`, not localhost
The threat-dashboard calls `/api/wazuh/*`; the platform path-router forwards
`/api` to the api-server artifact (no vite proxy). Root-relative `/api` is
correct here because the dashboard is mounted at `/`.
