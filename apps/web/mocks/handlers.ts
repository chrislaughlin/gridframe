import {
  type PanelCardDataResponse,
  type PanelCardPayload,
} from "@gridframe/react";
import { delay, http, HttpResponse } from "msw";

const allChartVariants = [
  "chart-area-default",
  "chart-area-linear",
  "chart-area-step",
  "chart-area-stacked",
  "chart-area-stacked-expand",
  "chart-area-legend",
  "chart-area-icons",
  "chart-area-gradient",
  "chart-area-axes",
  "chart-area-interactive",
  "chart-bar-interactive",
  "chart-bar-default",
  "chart-bar-horizontal",
  "chart-bar-multiple",
  "chart-bar-stacked",
  "chart-bar-label",
  "chart-bar-label-custom",
  "chart-bar-mixed",
  "chart-bar-active",
  "chart-bar-negative",
  "chart-line-default",
  "chart-line-linear",
  "chart-line-step",
  "chart-line-multiple",
  "chart-line-dots",
  "chart-line-dots-custom",
  "chart-line-dots-colors",
  "chart-line-label",
  "chart-line-label-custom",
  "chart-line-interactive",
  "chart-pie-simple",
  "chart-pie-separator",
  "chart-pie-label",
  "chart-pie-label-custom",
  "chart-pie-label-list",
  "chart-pie-legend",
  "chart-pie-donut",
  "chart-pie-donut-active",
  "chart-pie-donut-text",
  "chart-pie-stacked",
  "chart-pie-interactive",
  "chart-radar-default",
  "chart-radar-dots",
  "chart-radar-multiple",
  "chart-radar-lines-only",
  "chart-radar-label-custom",
  "chart-radar-grid-custom",
  "chart-radar-grid-fill",
  "chart-radar-grid-none",
  "chart-radar-grid-circle",
  "chart-radar-grid-circle-no-lines",
  "chart-radar-grid-circle-fill",
  "chart-radar-legend",
  "chart-radial-simple",
  "chart-radial-label",
  "chart-radial-grid",
  "chart-radial-text",
  "chart-radial-shape",
  "chart-radial-stacked",
  "chart-tooltip-default",
  "chart-tooltip-line-indicator",
  "chart-tooltip-no-indicator",
  "chart-tooltip-custom-label",
  "chart-tooltip-label-formatter",
  "chart-tooltip-formatter",
  "chart-tooltip-icons",
  "chart-tooltip-advanced",
] as const;

const chartVariantSet = new Set<string>(allChartVariants);

const handlers = [
  http.get("/api/gridframe/cards/:variant", async ({ params }) => {
    await delay(180);

    const variant = String(params.variant);

    if (!chartVariantSet.has(variant)) {
      return HttpResponse.json(
        { status: "error", message: "Unknown chart variant: " + variant },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      status: "success",
      data: getChartPayload(variant),
    } satisfies PanelCardDataResponse);
  }),
];

function getChartPayload(variant: string): PanelCardPayload {
  if (variant.startsWith("chart-area-")) return getAreaPayload(variant);
  if (variant.startsWith("chart-line-")) return getLinePayload(variant);
  if (variant.startsWith("chart-pie-")) return getPiePayload(variant);
  if (variant.startsWith("chart-radar-")) return getRadarPayload(variant);
  if (variant.startsWith("chart-radial-")) return getRadialPayload(variant);

  return getBarPayload(variant);
}

function getAreaPayload(variant: string): PanelCardPayload {
  return {
    visualization: "area",
    variant,
    indexKey: "month",
    curveType: variant.includes("linear")
      ? "linear"
      : variant.includes("step")
        ? "step"
        : "natural",
    stacked: variant.includes("stacked") || variant.includes("legend"),
    stackOffset: variant.includes("expand") ? "expand" : undefined,
    showLegend: variant.includes("legend") || variant.includes("icons"),
    showGradient: variant.includes("gradient"),
    showAxes: variant.includes("axes"),
    interactive: variant.includes("interactive"),
    series: withIcons(
      [
        { key: "desktop", label: "Desktop", color: "var(--chart-1)" },
        { key: "mobile", label: "Mobile", color: "var(--chart-2)" },
      ],
      variant,
    ),
    data: monthlyTraffic,
  };
}

function getBarPayload(variant: string): PanelCardPayload {
  const tooltip = getTooltipOptions(variant);
  const multiple = variant.includes("multiple") || variant.includes("stacked");

  return {
    visualization: "bar",
    variant,
    indexKey: variant.includes("tooltip") ? "date" : "browser",
    layout: variant.includes("horizontal") ? "horizontal" : undefined,
    stacked: variant.includes("stacked"),
    showLabels: variant.includes("label"),
    customLabels: variant.includes("custom"),
    mixed: variant.includes("mixed"),
    activeIndex:
      variant.includes("active") || variant.includes("interactive")
        ? 1
        : undefined,
    tooltip,
    series: withIcons(
      multiple
        ? [
            { key: "desktop", label: "Desktop", color: "var(--chart-1)" },
            { key: "mobile", label: "Mobile", color: "var(--chart-2)" },
          ]
        : [{ key: "visitors", label: "Visitors", color: "var(--chart-3)" }],
      variant,
    ),
    data: variant.includes("tooltip")
      ? datedTooltipData
      : multiple
        ? browserDeviceData
        : variant.includes("negative")
          ? browserDeltaData
          : browserVisitorData,
  };
}

function getLinePayload(variant: string): PanelCardPayload {
  const multiple = variant.includes("multiple");

  return {
    visualization: "line",
    variant,
    indexKey: "month",
    curveType: variant.includes("linear")
      ? "linear"
      : variant.includes("step")
        ? "step"
        : "monotone",
    showDots: variant.includes("dots"),
    customDots: variant.includes("dots-custom"),
    colorDots: variant.includes("dots-colors"),
    showLabels: variant.includes("label"),
    customLabels: variant.includes("label-custom"),
    interactive: variant.includes("interactive"),
    series: multiple
      ? [
          { key: "desktop", label: "Desktop", color: "var(--chart-1)" },
          { key: "mobile", label: "Mobile", color: "var(--chart-2)" },
        ]
      : [{ key: "desktop", label: "Desktop", color: "var(--chart-1)" }],
    data: monthlyTraffic,
  };
}

function getPiePayload(variant: string): PanelCardPayload {
  const total = pieBrowserData.reduce((sum, datum) => sum + datum.visitors, 0);

  return {
    visualization: "pie",
    variant,
    nameKey: "browser",
    valueKey: "visitors",
    separator: variant.includes("separator"),
    showLabels: variant.includes("label") && !variant.includes("legend"),
    customLabels: variant.includes("label-custom"),
    labelList: variant.includes("label-list"),
    showLegend: variant.includes("legend") || !variant.includes("simple"),
    donut: variant.includes("donut"),
    activeIndex:
      variant.includes("active") || variant.includes("interactive")
        ? 0
        : undefined,
    centerText: variant.includes("donut-text")
      ? total.toLocaleString()
      : undefined,
    stacked: variant.includes("stacked"),
    interactive: variant.includes("interactive"),
    series: browserSeries,
    data: pieBrowserData,
  };
}

function getRadarPayload(variant: string): PanelCardPayload {
  return {
    visualization: "radar",
    variant,
    indexKey: "dimension",
    showDots: variant.includes("dots"),
    linesOnly: variant.includes("lines-only"),
    customLabels: variant.includes("label-custom"),
    gridType: variant.includes("circle") ? "circle" : "polygon",
    gridFill: variant.includes("fill"),
    gridLines: !variant.includes("grid-none"),
    radialLines: !variant.includes("no-lines"),
    showLegend: variant.includes("legend"),
    series:
      variant.includes("multiple") || variant.includes("legend")
        ? [
            { key: "current", label: "Current", color: "var(--chart-1)" },
            { key: "target", label: "Target", color: "var(--chart-2)" },
          ]
        : [{ key: "current", label: "Current", color: "var(--chart-1)" }],
    data: radarData,
  };
}

function getRadialPayload(variant: string): PanelCardPayload {
  if (variant.includes("stacked")) {
    return {
      visualization: "radial",
      variant,
      nameKey: "segment",
      valueKey: "desktop",
      stacked: true,
      centerText: "72%",
      series: [
        { key: "desktop", label: "Desktop", color: "var(--chart-1)" },
        { key: "mobile", label: "Mobile", color: "var(--chart-2)" },
      ],
      data: [{ segment: "traffic", desktop: 62, mobile: 38 }],
    };
  }

  const total = radialData.reduce((sum, datum) => sum + datum.score, 0);

  return {
    visualization: "radial",
    variant,
    nameKey: "segment",
    valueKey: "score",
    showLabel: variant.includes("label"),
    showGrid: variant.includes("grid"),
    centerText: variant.includes("text")
      ? `${Math.round(total / radialData.length)}%`
      : undefined,
    shape: variant.includes("shape") ? "square" : "round",
    series: radialSeries,
    data: radialData,
  };
}

function getTooltipOptions(variant: string) {
  if (!variant.includes("tooltip")) return undefined;

  return {
    indicator: variant.includes("line-indicator")
      ? "line"
      : variant.includes("no-indicator")
        ? "none"
        : variant.includes("advanced")
          ? "dashed"
          : "dot",
    label: variant.includes("custom-label") ? "Custom label" : undefined,
    labelFormatter: variant.includes("label-formatter") ? "date" : undefined,
    valueFormatter:
      variant.includes("formatter") || variant.includes("advanced")
        ? "compact"
        : undefined,
    advanced: variant.includes("advanced"),
  } as const;
}

function withIcons<T extends { key: string; label: string; color: string }>(
  series: T[],
  variant: string,
) {
  if (!variant.includes("icons")) return series;

  return series.map((item, index) => ({
    ...item,
    icon: index === 0 ? "D" : "M",
  }));
}

const monthlyTraffic = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 214, mobile: 140 },
];

const browserVisitorData = [
  { browser: "Chrome", visitors: 275 },
  { browser: "Safari", visitors: 200 },
  { browser: "Firefox", visitors: 187 },
  { browser: "Edge", visitors: 173 },
  { browser: "Other", visitors: 90 },
];

const browserDeltaData = [
  { browser: "Chrome", visitors: 275 },
  { browser: "Safari", visitors: -120 },
  { browser: "Firefox", visitors: 187 },
  { browser: "Edge", visitors: -73 },
  { browser: "Other", visitors: 90 },
];

const browserDeviceData = [
  { browser: "Chrome", desktop: 186, mobile: 80 },
  { browser: "Safari", desktop: 305, mobile: 200 },
  { browser: "Firefox", desktop: 237, mobile: 120 },
  { browser: "Edge", desktop: 73, mobile: 190 },
  { browser: "Other", desktop: 209, mobile: 130 },
];

const datedTooltipData = [
  { date: "2024-07-15", visitors: 1286 },
  { date: "2024-07-16", visitors: 1000 },
  { date: "2024-07-17", visitors: 1486 },
  { date: "2024-07-18", visitors: 1689 },
  { date: "2024-07-19", visitors: 1292 },
  { date: "2024-07-20", visitors: 1424 },
];

const browserSeries = [
  { key: "chrome", label: "Chrome", color: "var(--chart-1)" },
  { key: "safari", label: "Safari", color: "var(--chart-2)" },
  { key: "firefox", label: "Firefox", color: "var(--chart-3)" },
  { key: "edge", label: "Edge", color: "var(--chart-4)" },
  { key: "other", label: "Other", color: "var(--chart-5)" },
];

const pieBrowserData = [
  { browser: "chrome", visitors: 275 },
  { browser: "safari", visitors: 200 },
  { browser: "firefox", visitors: 187 },
  { browser: "edge", visitors: 173 },
  { browser: "other", visitors: 90 },
];

const radarData = [
  { dimension: "Speed", current: 86, target: 92 },
  { dimension: "Reliability", current: 78, target: 88 },
  { dimension: "Access", current: 92, target: 90 },
  { dimension: "Quality", current: 81, target: 86 },
  { dimension: "Cost", current: 74, target: 82 },
  { dimension: "Support", current: 88, target: 91 },
];

const radialSeries = [
  { key: "docs", label: "Docs", color: "var(--chart-1)" },
  { key: "api", label: "API", color: "var(--chart-2)" },
  { key: "examples", label: "Examples", color: "var(--chart-3)" },
  { key: "support", label: "Support", color: "var(--chart-4)" },
];

const radialData = [
  { segment: "docs", score: 82 },
  { segment: "api", score: 68 },
  { segment: "examples", score: 74 },
  { segment: "support", score: 59 },
];

export { handlers };
