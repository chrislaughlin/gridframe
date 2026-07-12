# @gridframe/react

React components for rendering Gridframe dashboards.

```tsx
import { PanelDashboard, type PanelDashboardConfig } from "@gridframe/react";
import "@gridframe/react/styles.css";
```

Use `<PanelDashboard config={config} />` for a static Dashboard or `<PanelDashboard dashboard={{ userId }} />` for the API-managed flow. API-managed mode includes persisted layout and Card-name edits, Dashboard selection, the Card library, and generated Card Deeplinks.

`CardVisualization` and `SourceDataTable` are also exported as fetch-free presentation components for Card detail experiences.
