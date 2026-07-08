import {
  PanelDashboard,
  type PanelDashboardConfig,
} from "@gridframe/react";

const dashboardConfig = {
  title: "Product analytics",
  description:
    "Weekly adoption, activation, and content signals for a product planning review.",
  footer: {
    text: "Gridframe first-pass dashboard framework",
    href: "https://github.com",
  },
  cards: [
    {
      id: "activation-rate",
      name: "Activation rate",
      visualization: "metric",
      query: "/api/gridframe/cards/activation-rate",
      deeplink: {
        href: "/analytics/activation",
        label: "View activation cohort",
      },
    },
    {
      id: "active-users",
      name: "Active users",
      visualization: "line",
      query: "/api/gridframe/cards/active-users",
      deeplink: {
        href: "/analytics/active-users",
        label: "Open user trend",
      },
    },
    {
      id: "acquisition-channel",
      name: "Acquisition channel",
      visualization: "bar",
      query: "/api/gridframe/cards/acquisition-channel",
      deeplink: {
        href: "/analytics/acquisition",
        label: "Inspect channels",
      },
    },
    {
      id: "top-pages",
      name: "Top pages",
      visualization: "table",
      query: "/api/gridframe/cards/top-pages",
      deeplink: {
        href: "/analytics/pages",
        label: "Review content paths",
      },
    },
  ],
} satisfies PanelDashboardConfig;

export default function Home() {
  return <PanelDashboard config={dashboardConfig} />;
}
