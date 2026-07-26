# @gridframe/react

React components for rendering Gridframe dashboards.

```tsx
import { PanelDashboard, type PanelDashboardConfig } from "@gridframe/react";
import "@gridframe/react/styles.css";
```

Use `<PanelDashboard config={config} />` for a static Dashboard or `<PanelDashboard dashboard={{ userId }} />` for the API-managed flow. API-managed mode includes persisted layout and Card-name edits, Dashboard selection, the Card library, and generated Card Deeplinks.

`CardVisualization` and `SourceDataTable` are also exported as fetch-free presentation components for Card detail experiences.

## Themes

Gridframe ships reusable Light, Dark, and High Contrast Theme presets plus a
generator for consumer-owned Themes:

```tsx
import { GridframeThemeScope, PanelDashboard } from "@gridframe/react";
import {
  createGridframeTheme,
  highContrastTheme,
} from "@gridframe/react/theme";

const custom = createGridframeTheme(
  {
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#111827",
    primary: "#1d4ed8",
    accent: "#0f766e",
    destructive: "#b91c1c",
  },
  { name: "Product analytics" },
);

<PanelDashboard config={config} theme={highContrastTheme} />;

<GridframeThemeScope theme={custom.theme}>
  <DashboardExperience />
</GridframeThemeScope>;
```

The server-safe `@gridframe/react/theme` subpath exports Theme types, presets,
generation and validation functions, and versioned JSON and CSS-variable
serializers. `createGridframeTheme` always returns structured validation issues;
check `result.valid` before making a generated Theme selectable.

## AI-generated Dashboard proposals

API-managed mode includes a **Create with AI** dialog when the host mounts the
Dashboard AI routes. Users can:

- edit the current Dashboard or propose a new named Dashboard;
- start from the bundled prompt examples;
- review proposed actions, assumptions, missing information, validation
  messages, and the server-resolved Card layout;
- apply a valid proposal explicitly.

Generation never changes the Dashboard. The dialog calls the proposal endpoint
first and only calls Apply after the user selects **Apply proposal**. Successful
creation switches `PanelDashboard` to the new Dashboard through the existing
`onDashboardChange` flow.

The provider, safe field catalogue, permissions, and persistence live in
`@gridframe/server`; no provider credential is passed to the React package. See
[AI-generated Dashboards](https://github.com/chrislaughlin/gridframe/blob/main/docs/ai-dashboards.md)
for the complete server setup and security model.
