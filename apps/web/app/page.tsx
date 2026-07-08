import { PanelDashboard, type PanelDashboardConfig } from "@gridframe/react";

const dashboardConfig = {
  title: "shadcn/ui charts showcase",
  description:
    "A Gridframe dashboard example covering every official shadcn/ui chart variant, with each card fetching its example data through MSW.",
  footer: {
    text: "Gridframe chart dashboard framework",
    href: "https://github.com",
  },
  cards: [
    {
      id: "chart-area-default",
      name: "Area Default",
      visualization: "area",
      query: "/api/gridframe/cards/chart-area-default",
      deeplink: {
        href: "https://ui.shadcn.com/charts/area",
        label: "Open shadcn area charts",
      },
    },
    {
      id: "chart-area-linear",
      name: "Area Linear",
      visualization: "area",
      query: "/api/gridframe/cards/chart-area-linear",
      deeplink: {
        href: "https://ui.shadcn.com/charts/area",
        label: "Open shadcn area charts",
      },
    },
    {
      id: "chart-area-step",
      name: "Area Step",
      visualization: "area",
      query: "/api/gridframe/cards/chart-area-step",
      deeplink: {
        href: "https://ui.shadcn.com/charts/area",
        label: "Open shadcn area charts",
      },
    },
    {
      id: "chart-area-stacked",
      name: "Area Stacked",
      visualization: "area",
      query: "/api/gridframe/cards/chart-area-stacked",
      deeplink: {
        href: "https://ui.shadcn.com/charts/area",
        label: "Open shadcn area charts",
      },
    },
    {
      id: "chart-area-stacked-expand",
      name: "Area Stacked Expand",
      visualization: "area",
      query: "/api/gridframe/cards/chart-area-stacked-expand",
      deeplink: {
        href: "https://ui.shadcn.com/charts/area",
        label: "Open shadcn area charts",
      },
    },
    {
      id: "chart-area-legend",
      name: "Area Legend",
      visualization: "area",
      query: "/api/gridframe/cards/chart-area-legend",
      deeplink: {
        href: "https://ui.shadcn.com/charts/area",
        label: "Open shadcn area charts",
      },
    },
    {
      id: "chart-area-icons",
      name: "Area Icons",
      visualization: "area",
      query: "/api/gridframe/cards/chart-area-icons",
      deeplink: {
        href: "https://ui.shadcn.com/charts/area",
        label: "Open shadcn area charts",
      },
    },
    {
      id: "chart-area-gradient",
      name: "Area Gradient",
      visualization: "area",
      query: "/api/gridframe/cards/chart-area-gradient",
      deeplink: {
        href: "https://ui.shadcn.com/charts/area",
        label: "Open shadcn area charts",
      },
    },
    {
      id: "chart-area-axes",
      name: "Area Axes",
      visualization: "area",
      query: "/api/gridframe/cards/chart-area-axes",
      deeplink: {
        href: "https://ui.shadcn.com/charts/area",
        label: "Open shadcn area charts",
      },
    },
    {
      id: "chart-area-interactive",
      name: "Area Interactive",
      visualization: "area",
      query: "/api/gridframe/cards/chart-area-interactive",
      deeplink: {
        href: "https://ui.shadcn.com/charts/area",
        label: "Open shadcn area charts",
      },
    },
    {
      id: "chart-bar-interactive",
      name: "Bar Interactive",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-bar-interactive",
      deeplink: {
        href: "https://ui.shadcn.com/charts/bar",
        label: "Open shadcn bar charts",
      },
    },
    {
      id: "chart-bar-default",
      name: "Bar Default",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-bar-default",
      deeplink: {
        href: "https://ui.shadcn.com/charts/bar",
        label: "Open shadcn bar charts",
      },
    },
    {
      id: "chart-bar-horizontal",
      name: "Bar Horizontal",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-bar-horizontal",
      deeplink: {
        href: "https://ui.shadcn.com/charts/bar",
        label: "Open shadcn bar charts",
      },
    },
    {
      id: "chart-bar-multiple",
      name: "Bar Multiple",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-bar-multiple",
      deeplink: {
        href: "https://ui.shadcn.com/charts/bar",
        label: "Open shadcn bar charts",
      },
    },
    {
      id: "chart-bar-stacked",
      name: "Bar Stacked",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-bar-stacked",
      deeplink: {
        href: "https://ui.shadcn.com/charts/bar",
        label: "Open shadcn bar charts",
      },
    },
    {
      id: "chart-bar-label",
      name: "Bar Label",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-bar-label",
      deeplink: {
        href: "https://ui.shadcn.com/charts/bar",
        label: "Open shadcn bar charts",
      },
    },
    {
      id: "chart-bar-label-custom",
      name: "Bar Label Custom",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-bar-label-custom",
      deeplink: {
        href: "https://ui.shadcn.com/charts/bar",
        label: "Open shadcn bar charts",
      },
    },
    {
      id: "chart-bar-mixed",
      name: "Bar Mixed",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-bar-mixed",
      deeplink: {
        href: "https://ui.shadcn.com/charts/bar",
        label: "Open shadcn bar charts",
      },
    },
    {
      id: "chart-bar-active",
      name: "Bar Active",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-bar-active",
      deeplink: {
        href: "https://ui.shadcn.com/charts/bar",
        label: "Open shadcn bar charts",
      },
    },
    {
      id: "chart-bar-negative",
      name: "Bar Negative",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-bar-negative",
      deeplink: {
        href: "https://ui.shadcn.com/charts/bar",
        label: "Open shadcn bar charts",
      },
    },
    {
      id: "chart-line-default",
      name: "Line Default",
      visualization: "line",
      query: "/api/gridframe/cards/chart-line-default",
      deeplink: {
        href: "https://ui.shadcn.com/charts/line",
        label: "Open shadcn line charts",
      },
    },
    {
      id: "chart-line-linear",
      name: "Line Linear",
      visualization: "line",
      query: "/api/gridframe/cards/chart-line-linear",
      deeplink: {
        href: "https://ui.shadcn.com/charts/line",
        label: "Open shadcn line charts",
      },
    },
    {
      id: "chart-line-step",
      name: "Line Step",
      visualization: "line",
      query: "/api/gridframe/cards/chart-line-step",
      deeplink: {
        href: "https://ui.shadcn.com/charts/line",
        label: "Open shadcn line charts",
      },
    },
    {
      id: "chart-line-multiple",
      name: "Line Multiple",
      visualization: "line",
      query: "/api/gridframe/cards/chart-line-multiple",
      deeplink: {
        href: "https://ui.shadcn.com/charts/line",
        label: "Open shadcn line charts",
      },
    },
    {
      id: "chart-line-dots",
      name: "Line Dots",
      visualization: "line",
      query: "/api/gridframe/cards/chart-line-dots",
      deeplink: {
        href: "https://ui.shadcn.com/charts/line",
        label: "Open shadcn line charts",
      },
    },
    {
      id: "chart-line-dots-custom",
      name: "Line Dots Custom",
      visualization: "line",
      query: "/api/gridframe/cards/chart-line-dots-custom",
      deeplink: {
        href: "https://ui.shadcn.com/charts/line",
        label: "Open shadcn line charts",
      },
    },
    {
      id: "chart-line-dots-colors",
      name: "Line Dots Colors",
      visualization: "line",
      query: "/api/gridframe/cards/chart-line-dots-colors",
      deeplink: {
        href: "https://ui.shadcn.com/charts/line",
        label: "Open shadcn line charts",
      },
    },
    {
      id: "chart-line-label",
      name: "Line Label",
      visualization: "line",
      query: "/api/gridframe/cards/chart-line-label",
      deeplink: {
        href: "https://ui.shadcn.com/charts/line",
        label: "Open shadcn line charts",
      },
    },
    {
      id: "chart-line-label-custom",
      name: "Line Label Custom",
      visualization: "line",
      query: "/api/gridframe/cards/chart-line-label-custom",
      deeplink: {
        href: "https://ui.shadcn.com/charts/line",
        label: "Open shadcn line charts",
      },
    },
    {
      id: "chart-line-interactive",
      name: "Line Interactive",
      visualization: "line",
      query: "/api/gridframe/cards/chart-line-interactive",
      deeplink: {
        href: "https://ui.shadcn.com/charts/line",
        label: "Open shadcn line charts",
      },
    },
    {
      id: "chart-pie-simple",
      name: "Pie Simple",
      visualization: "pie",
      query: "/api/gridframe/cards/chart-pie-simple",
      deeplink: {
        href: "https://ui.shadcn.com/charts/pie",
        label: "Open shadcn pie charts",
      },
    },
    {
      id: "chart-pie-separator",
      name: "Pie Separator",
      visualization: "pie",
      query: "/api/gridframe/cards/chart-pie-separator",
      deeplink: {
        href: "https://ui.shadcn.com/charts/pie",
        label: "Open shadcn pie charts",
      },
    },
    {
      id: "chart-pie-label",
      name: "Pie Label",
      visualization: "pie",
      query: "/api/gridframe/cards/chart-pie-label",
      deeplink: {
        href: "https://ui.shadcn.com/charts/pie",
        label: "Open shadcn pie charts",
      },
    },
    {
      id: "chart-pie-label-custom",
      name: "Pie Label Custom",
      visualization: "pie",
      query: "/api/gridframe/cards/chart-pie-label-custom",
      deeplink: {
        href: "https://ui.shadcn.com/charts/pie",
        label: "Open shadcn pie charts",
      },
    },
    {
      id: "chart-pie-label-list",
      name: "Pie Label List",
      visualization: "pie",
      query: "/api/gridframe/cards/chart-pie-label-list",
      deeplink: {
        href: "https://ui.shadcn.com/charts/pie",
        label: "Open shadcn pie charts",
      },
    },
    {
      id: "chart-pie-legend",
      name: "Pie Legend",
      visualization: "pie",
      query: "/api/gridframe/cards/chart-pie-legend",
      deeplink: {
        href: "https://ui.shadcn.com/charts/pie",
        label: "Open shadcn pie charts",
      },
    },
    {
      id: "chart-pie-donut",
      name: "Pie Donut",
      visualization: "pie",
      query: "/api/gridframe/cards/chart-pie-donut",
      deeplink: {
        href: "https://ui.shadcn.com/charts/pie",
        label: "Open shadcn pie charts",
      },
    },
    {
      id: "chart-pie-donut-active",
      name: "Pie Donut Active",
      visualization: "pie",
      query: "/api/gridframe/cards/chart-pie-donut-active",
      deeplink: {
        href: "https://ui.shadcn.com/charts/pie",
        label: "Open shadcn pie charts",
      },
    },
    {
      id: "chart-pie-donut-text",
      name: "Pie Donut Text",
      visualization: "pie",
      query: "/api/gridframe/cards/chart-pie-donut-text",
      deeplink: {
        href: "https://ui.shadcn.com/charts/pie",
        label: "Open shadcn pie charts",
      },
    },
    {
      id: "chart-pie-stacked",
      name: "Pie Stacked",
      visualization: "pie",
      query: "/api/gridframe/cards/chart-pie-stacked",
      deeplink: {
        href: "https://ui.shadcn.com/charts/pie",
        label: "Open shadcn pie charts",
      },
    },
    {
      id: "chart-pie-interactive",
      name: "Pie Interactive",
      visualization: "pie",
      query: "/api/gridframe/cards/chart-pie-interactive",
      deeplink: {
        href: "https://ui.shadcn.com/charts/pie",
        label: "Open shadcn pie charts",
      },
    },
    {
      id: "chart-radar-default",
      name: "Radar Default",
      visualization: "radar",
      query: "/api/gridframe/cards/chart-radar-default",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radar",
        label: "Open shadcn radar charts",
      },
    },
    {
      id: "chart-radar-dots",
      name: "Radar Dots",
      visualization: "radar",
      query: "/api/gridframe/cards/chart-radar-dots",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radar",
        label: "Open shadcn radar charts",
      },
    },
    {
      id: "chart-radar-multiple",
      name: "Radar Multiple",
      visualization: "radar",
      query: "/api/gridframe/cards/chart-radar-multiple",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radar",
        label: "Open shadcn radar charts",
      },
    },
    {
      id: "chart-radar-lines-only",
      name: "Radar Lines Only",
      visualization: "radar",
      query: "/api/gridframe/cards/chart-radar-lines-only",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radar",
        label: "Open shadcn radar charts",
      },
    },
    {
      id: "chart-radar-label-custom",
      name: "Radar Label Custom",
      visualization: "radar",
      query: "/api/gridframe/cards/chart-radar-label-custom",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radar",
        label: "Open shadcn radar charts",
      },
    },
    {
      id: "chart-radar-grid-custom",
      name: "Radar Grid Custom",
      visualization: "radar",
      query: "/api/gridframe/cards/chart-radar-grid-custom",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radar",
        label: "Open shadcn radar charts",
      },
    },
    {
      id: "chart-radar-grid-fill",
      name: "Radar Grid Fill",
      visualization: "radar",
      query: "/api/gridframe/cards/chart-radar-grid-fill",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radar",
        label: "Open shadcn radar charts",
      },
    },
    {
      id: "chart-radar-grid-none",
      name: "Radar Grid None",
      visualization: "radar",
      query: "/api/gridframe/cards/chart-radar-grid-none",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radar",
        label: "Open shadcn radar charts",
      },
    },
    {
      id: "chart-radar-grid-circle",
      name: "Radar Grid Circle",
      visualization: "radar",
      query: "/api/gridframe/cards/chart-radar-grid-circle",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radar",
        label: "Open shadcn radar charts",
      },
    },
    {
      id: "chart-radar-grid-circle-no-lines",
      name: "Radar Grid Circle No Lines",
      visualization: "radar",
      query: "/api/gridframe/cards/chart-radar-grid-circle-no-lines",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radar",
        label: "Open shadcn radar charts",
      },
    },
    {
      id: "chart-radar-grid-circle-fill",
      name: "Radar Grid Circle Fill",
      visualization: "radar",
      query: "/api/gridframe/cards/chart-radar-grid-circle-fill",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radar",
        label: "Open shadcn radar charts",
      },
    },
    {
      id: "chart-radar-legend",
      name: "Radar Legend",
      visualization: "radar",
      query: "/api/gridframe/cards/chart-radar-legend",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radar",
        label: "Open shadcn radar charts",
      },
    },
    {
      id: "chart-radial-simple",
      name: "Radial Simple",
      visualization: "radial",
      query: "/api/gridframe/cards/chart-radial-simple",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radial",
        label: "Open shadcn radial charts",
      },
    },
    {
      id: "chart-radial-label",
      name: "Radial Label",
      visualization: "radial",
      query: "/api/gridframe/cards/chart-radial-label",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radial",
        label: "Open shadcn radial charts",
      },
    },
    {
      id: "chart-radial-grid",
      name: "Radial Grid",
      visualization: "radial",
      query: "/api/gridframe/cards/chart-radial-grid",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radial",
        label: "Open shadcn radial charts",
      },
    },
    {
      id: "chart-radial-text",
      name: "Radial Text",
      visualization: "radial",
      query: "/api/gridframe/cards/chart-radial-text",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radial",
        label: "Open shadcn radial charts",
      },
    },
    {
      id: "chart-radial-shape",
      name: "Radial Shape",
      visualization: "radial",
      query: "/api/gridframe/cards/chart-radial-shape",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radial",
        label: "Open shadcn radial charts",
      },
    },
    {
      id: "chart-radial-stacked",
      name: "Radial Stacked",
      visualization: "radial",
      query: "/api/gridframe/cards/chart-radial-stacked",
      deeplink: {
        href: "https://ui.shadcn.com/charts/radial",
        label: "Open shadcn radial charts",
      },
    },
    {
      id: "chart-tooltip-default",
      name: "Tooltip Default",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-tooltip-default",
      deeplink: {
        href: "https://ui.shadcn.com/charts/tooltip",
        label: "Open shadcn tooltip examples",
      },
    },
    {
      id: "chart-tooltip-line-indicator",
      name: "Tooltip Line Indicator",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-tooltip-line-indicator",
      deeplink: {
        href: "https://ui.shadcn.com/charts/tooltip",
        label: "Open shadcn tooltip examples",
      },
    },
    {
      id: "chart-tooltip-no-indicator",
      name: "Tooltip No Indicator",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-tooltip-no-indicator",
      deeplink: {
        href: "https://ui.shadcn.com/charts/tooltip",
        label: "Open shadcn tooltip examples",
      },
    },
    {
      id: "chart-tooltip-custom-label",
      name: "Tooltip Custom Label",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-tooltip-custom-label",
      deeplink: {
        href: "https://ui.shadcn.com/charts/tooltip",
        label: "Open shadcn tooltip examples",
      },
    },
    {
      id: "chart-tooltip-label-formatter",
      name: "Tooltip Label Formatter",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-tooltip-label-formatter",
      deeplink: {
        href: "https://ui.shadcn.com/charts/tooltip",
        label: "Open shadcn tooltip examples",
      },
    },
    {
      id: "chart-tooltip-formatter",
      name: "Tooltip Formatter",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-tooltip-formatter",
      deeplink: {
        href: "https://ui.shadcn.com/charts/tooltip",
        label: "Open shadcn tooltip examples",
      },
    },
    {
      id: "chart-tooltip-icons",
      name: "Tooltip Icons",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-tooltip-icons",
      deeplink: {
        href: "https://ui.shadcn.com/charts/tooltip",
        label: "Open shadcn tooltip examples",
      },
    },
    {
      id: "chart-tooltip-advanced",
      name: "Tooltip Advanced",
      visualization: "bar",
      query: "/api/gridframe/cards/chart-tooltip-advanced",
      deeplink: {
        href: "https://ui.shadcn.com/charts/tooltip",
        label: "Open shadcn tooltip examples",
      },
    },
  ],
} satisfies PanelDashboardConfig;

export default function Home() {
  return <PanelDashboard config={dashboardConfig} />;
}
