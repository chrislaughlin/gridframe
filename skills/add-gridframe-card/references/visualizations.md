# Visualization Selection

Read only the section for the chosen Visualization. Confirm the exact installed `PanelCardPayload` declaration before coding.

## Metric

Use for one primary string or number. Return `visualization`, `value`, and optionally `label`, `helperText`, and `trend`. Default to `1 x 2`.

## Bar, area, and line

Use `indexKey`, scalar `data` rows, and `series` entries with key, label, and semantic chart color. Bar compares categories; line emphasizes change; area emphasizes magnitude over an ordered axis. Default to `2 x 4`, widening dense bars when needed.

## Pie and radial

Use `nameKey`, `valueKey`, data, and one series entry per category. Use pie for parts of a whole and radial for compact progress/composition displays. Keep category counts small and ensure colors remain distinguishable.

## Radar

Use `indexKey`, data, and series for comparable dimensions on a common scale. Avoid radar when values use unrelated units.

## Table

Use stable `columns` and scalar `rows`. Prefer a table when exact records matter more than visual comparison. Default to `4 x 4`.

## Shared rules

- Return values accepted by the installed Zod schema; normalize dates and rich objects.
- Follow existing formatter and chart color conventions.
- Test empty and malformed upstream data.
- Ensure a successful response's Visualization equals the definition's Visualization.
