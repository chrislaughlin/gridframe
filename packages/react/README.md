# @gridframe/react

React components for rendering Gridframe dashboards.

```tsx
import { PanelDashboard, type PanelDashboardConfig } from "@gridframe/react";
import "@gridframe/react/styles.css";
```

Use `<PanelDashboard config={config} />` for a static Dashboard or `<PanelDashboard dashboard={{ userId }} />` for the API-managed flow. API-managed mode includes persisted layout and Card-name edits, Dashboard selection, the Card library, and generated Card Deeplinks.

`CardVisualization` and `SourceDataTable` are also exported as fetch-free presentation components for Card detail experiences.

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
