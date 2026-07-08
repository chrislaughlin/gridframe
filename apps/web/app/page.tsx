import {
  PanelDashboard,
  type PanelDashboardConfig,
} from "@gridframe/react";

const dashboardConfig = {
  title: "shadcn/ui charts showcase",
  description:
    "A Gridframe dashboard example covering the official shadcn/ui chart families: area, bar, line, pie, radar, and radial.",
  footer: {
    text: "Gridframe chart dashboard framework",
    href: "https://github.com",
  },
  cards: [
    {
      id: "area-chart",
      name: "Area Chart",
      visualization: "area",
      query: "/api/gridframe/cards/area-chart",
      deeplink: {
        href: "https://ui.shadcn.com/charts/area",
        label: "Open shadcn area examples",
      },
    },
    {
      id: "bar-chart",
      name: "Bar Chart",
      visualization: "bar",
      query: "/api/gridframe/cards/bar-chart",
      deeplink: {
        href: "https://ui.shadcn.com/charts/bar",
        label: "Open shadcn bar examples",
      },
    },
    {
      id: "line-chart",
      name: "Line Chart",
      visualization: "line",
      query: "/api/gridframe/cards/line-chart",
      deeplink: {
        href: "https://ui.shadcn.com/charts/line",
        label: "Open shadcn line examples",
      },
    },
    {
      id: "pie-chart",
      name: "Pie Chart",
      visualization: "pie",
      query: "/api/gridframe/cards/pie-chart",
      deeplink: {
        href: "https://ui.shadcn.com/charts/pie",
        label: "Open shadcn pie examples",
      },
    },
    {
      id: "radar-chart",
      name: "Radar Chart",
      visualization: "radar",
      query: "/api/gridframe/cards/radar-chart",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radar",
        label: "Open shadcn radar examples",
      },
    },
    {
      id: "radial-chart",
      name: "Radial Chart",
      visualization: "radial",
      query: "/api/gridframe/cards/radial-chart",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radial",
        label: "Open shadcn radial examples",
      },
    },
  ],
} satisfies PanelDashboardConfig;

export default function Home() {
  return <PanelDashboard config={dashboardConfig} />;
}
