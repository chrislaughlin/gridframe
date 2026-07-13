---
name: add-gridframe-card
description: Add or maintain Card definitions in an API-managed Gridframe consumer application. Use when creating a new metric, chart, or table Card; exposing it through the Card library; changing a Card resolver or Visualization; adding drill-down source data; or adopting a pre-manifest Gridframe integration for future Card maintenance.
---

# Add Gridframe Card

Add one complete Card capability while preserving the consumer's Dashboard infrastructure.

## 1. Locate the integration

Run `node scripts/inspect-gridframe.mjs <application-root>` from this skill directory.

- If exactly one valid `gridframe.json` is found, read every mapped file before editing.
- If several manifests are found, ask which integrated application is in scope.
- If no manifest exists but Gridframe code is detected, read [legacy-adoption.md](references/legacy-adoption.md), confirm the discovered mapping, migrate only Card metadata and resolver dispatch to `defineCards`, and create the manifest.
- If no integration exists, stop and use `setup-gridframe-dashboard`.

Read [card-definitions.md](references/card-definitions.md) before editing. Read only the selected Visualization section in [visualizations.md](references/visualizations.md).

## 2. Resolve Card intent

Discover what the code and data model already answer. Ask only for missing product decisions: metric or dimensions, time range, name, description, and whether users need underlying records.

Choose the Visualization from the data shape. Follow existing naming, query, formatting, and color conventions. Use a stable lowercase hyphenated definition key.

## 3. Add the Card

1. Add one entry to the `defineCards` registry with library metadata, default layout, and a per-Card resolver.
2. Reuse application data access; do not expose internal endpoints to the browser.
3. Return `empty` for a legitimate no-data result. Let unexpected failures throw so Gridframe returns its sanitized Card query error.
4. Include normalized `sourceData` and a `deeplinkLabel` when underlying records are useful to users; otherwise omit both.
5. Add focused resolver and handler coverage.

The derived `cardLibrary` makes the Card available to users. Do not edit the Dashboard seed unless the developer explicitly asks for the Card to appear on newly created Dashboards.

## 4. Verify

Follow [verification.md](references/verification.md). Run `node scripts/inspect-gridframe.mjs <application-root>` again, then the application's typecheck/tests, the Card data HTTP request, the Card library flow, and browser rendering when available. Verify empty, success, and upstream-failure behavior.

Report browser or live-data checks that could not run. Do not claim the Card works end to end from typechecking alone.
