import type { PanelCardPayload } from "@gridframe/core";
import type { ExampleDefinition } from "./examples";

type ChartExampleInput = Omit<ExampleDefinition, "code"> & {
  data: PanelCardPayload;
};

function chartExample(input: ChartExampleInput): ExampleDefinition {
  return {
    ...input,
    code: JSON.stringify(input.data, null, 2),
  };
}

const timeData = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 214, mobile: 140 },
];

const timeSeries = [
  { key: "desktop", label: "Desktop", color: "var(--chart-1)" },
  { key: "mobile", label: "Mobile", color: "var(--chart-2)" },
];

const browserData = [
  { browser: "Chrome", visitors: 275 },
  { browser: "Safari", visitors: 200 },
  { browser: "Firefox", visitors: 187 },
  { browser: "Edge", visitors: 173 },
  { browser: "Other", visitors: 90 },
];

const browserSeries = [
  { key: "Chrome", label: "Chrome", color: "var(--chart-1)" },
  { key: "Safari", label: "Safari", color: "var(--chart-2)" },
  { key: "Firefox", label: "Firefox", color: "var(--chart-3)" },
  { key: "Edge", label: "Edge", color: "var(--chart-4)" },
  { key: "Other", label: "Other", color: "var(--chart-5)" },
];

const radarData = [
  { month: "Jan", desktop: 186, mobile: 110 },
  { month: "Feb", desktop: 305, mobile: 240 },
  { month: "Mar", desktop: 237, mobile: 190 },
  { month: "Apr", desktop: 273, mobile: 210 },
  { month: "May", desktop: 209, mobile: 170 },
  { month: "Jun", desktop: 214, mobile: 180 },
];

const area = (options: Record<string, unknown> = {}) =>
  ({
    visualization: "area",
    indexKey: "month",
    data: timeData,
    series: timeSeries,
    ...options,
  }) as PanelCardPayload;

const bar = (options: Record<string, unknown> = {}) =>
  ({
    visualization: "bar",
    indexKey: "month",
    data: timeData,
    series: timeSeries.slice(0, 1),
    ...options,
  }) as PanelCardPayload;

const line = (options: Record<string, unknown> = {}) =>
  ({
    visualization: "line",
    indexKey: "month",
    data: timeData,
    series: timeSeries.slice(0, 1),
    ...options,
  }) as PanelCardPayload;

const pie = (options: Record<string, unknown> = {}) =>
  ({
    visualization: "pie",
    nameKey: "browser",
    valueKey: "visitors",
    data: browserData,
    series: browserSeries,
    showLegend: false,
    ...options,
  }) as PanelCardPayload;

const radar = (options: Record<string, unknown> = {}) =>
  ({
    visualization: "radar",
    indexKey: "month",
    data: radarData,
    series: timeSeries.slice(0, 1),
    ...options,
  }) as PanelCardPayload;

const radial = (options: Record<string, unknown> = {}) =>
  ({
    visualization: "radial",
    nameKey: "browser",
    valueKey: "visitors",
    data: browserData,
    series: browserSeries,
    ...options,
  }) as PanelCardPayload;

const inputs: ChartExampleInput[] = [
  {
    slug: "chart-area-interactive",
    title: "Area Chart — Interactive",
    description:
      "An interactive area chart with series totals and a focused data series.",
    visualization: "area",
    data: area({ interactive: true, showGradient: true }),
  },
  {
    slug: "chart-area-linear",
    title: "Area Chart — Linear",
    description: "An area chart with straight line segments between values.",
    visualization: "area",
    data: area({ curveType: "linear" }),
  },
  {
    slug: "chart-area-step",
    title: "Area Chart — Step",
    description: "An area chart using stepped changes between values.",
    visualization: "area",
    data: area({ curveType: "step" }),
  },
  {
    slug: "chart-area-legend",
    title: "Area Chart — Legend",
    description: "A multi-series area chart with a legend.",
    visualization: "area",
    data: area({ showLegend: true }),
  },
  {
    slug: "chart-area-stacked",
    title: "Area Chart — Stacked",
    description: "Multiple area series stacked to show their combined volume.",
    visualization: "area",
    data: area({ stacked: true }),
  },
  {
    slug: "chart-area-stacked-expand",
    title: "Area Chart — Stacked Expanded",
    description:
      "A normalized stacked area chart showing proportional contribution.",
    visualization: "area",
    data: area({
      stacked: true,
      stackOffset: "expand",
      tooltip: { valueFormatter: "percent" },
    }),
  },
  {
    slug: "chart-area-icons",
    title: "Area Chart — Icons",
    description: "An area chart whose legend series include identifying icons.",
    visualization: "area",
    data: area({
      showLegend: true,
      series: [
        { ...timeSeries[0], icon: "⌘" },
        { ...timeSeries[1], icon: "◈" },
      ],
    }),
  },
  {
    slug: "chart-area-gradient",
    title: "Area Chart — Gradient",
    description: "An area chart with gradient fills beneath each series.",
    visualization: "area",
    data: area({ showGradient: true }),
  },
  {
    slug: "chart-area-axes",
    title: "Area Chart — Axes",
    description:
      "An area chart with both horizontal and vertical axes visible.",
    visualization: "area",
    data: area({ showAxes: true }),
  },
  {
    slug: "chart-bar-interactive",
    title: "Bar Chart — Interactive",
    description:
      "An interactive bar chart with series totals and a focused series.",
    visualization: "bar",
    data: bar({ interactive: true, series: timeSeries }),
  },
  {
    slug: "chart-bar-horizontal",
    title: "Bar Chart — Horizontal",
    description: "A horizontal bar chart for long category labels.",
    visualization: "bar",
    data: bar({ layout: "horizontal" }),
  },
  {
    slug: "chart-bar-multiple",
    title: "Bar Chart — Multiple",
    description: "Grouped bars comparing two series side by side.",
    visualization: "bar",
    data: bar({ series: timeSeries }),
  },
  {
    slug: "chart-bar-stacked",
    title: "Bar Chart — Stacked",
    description:
      "Multiple bar series stacked into a single total per category.",
    visualization: "bar",
    data: bar({ series: timeSeries, stacked: true }),
  },
  {
    slug: "chart-bar-label",
    title: "Bar Chart — Label",
    description: "A bar chart with values displayed directly on the bars.",
    visualization: "bar",
    data: bar({ showLabels: true }),
  },
  {
    slug: "chart-bar-label-custom",
    title: "Bar Chart — Custom Label",
    description: "A bar chart with formatted, descriptive value labels.",
    visualization: "bar",
    data: bar({ showLabels: true, customLabels: true }),
  },
  {
    slug: "chart-bar-mixed",
    title: "Bar Chart — Mixed",
    description:
      "A single-series bar chart with a different color for each category.",
    visualization: "bar",
    data: bar({ mixed: true }),
  },
  {
    slug: "chart-bar-active",
    title: "Bar Chart — Active",
    description: "A bar chart that emphasizes one active category.",
    visualization: "bar",
    data: bar({ activeIndex: 2 }),
  },
  {
    slug: "chart-bar-negative",
    title: "Bar Chart — Negative",
    description:
      "A bar chart that compares positive and negative values around zero.",
    visualization: "bar",
    data: bar({
      data: [
        { month: "Jan", desktop: 186 },
        { month: "Feb", desktop: -145 },
        { month: "Mar", desktop: 237 },
        { month: "Apr", desktop: -73 },
        { month: "May", desktop: 209 },
        { month: "Jun", desktop: -114 },
      ],
    }),
  },
  {
    slug: "chart-line-interactive",
    title: "Line Chart — Interactive",
    description:
      "An interactive line chart with series totals and a focused series.",
    visualization: "line",
    data: line({ interactive: true, series: timeSeries }),
  },
  {
    slug: "chart-line-linear",
    title: "Line Chart — Linear",
    description: "A line chart with straight segments between each point.",
    visualization: "line",
    data: line({ curveType: "linear" }),
  },
  {
    slug: "chart-line-step",
    title: "Line Chart — Step",
    description: "A stepped line chart for discrete changes over time.",
    visualization: "line",
    data: line({ curveType: "step" }),
  },
  {
    slug: "chart-line-multiple",
    title: "Line Chart — Multiple",
    description: "Multiple lines comparing two series over the same interval.",
    visualization: "line",
    data: line({ series: timeSeries }),
  },
  {
    slug: "chart-line-dots",
    title: "Line Chart — Dots",
    description: "A line chart with a visible marker for every data point.",
    visualization: "line",
    data: line({ showDots: true }),
  },
  {
    slug: "chart-line-dots-custom",
    title: "Line Chart — Custom Dots",
    description: "A line chart with larger outlined data-point markers.",
    visualization: "line",
    data: line({ showDots: true, customDots: true }),
  },
  {
    slug: "chart-line-dots-colors",
    title: "Line Chart — Colored Dots",
    description: "A line chart with solid markers colored by series.",
    visualization: "line",
    data: line({ showDots: true, colorDots: true }),
  },
  {
    slug: "chart-line-label",
    title: "Line Chart — Label",
    description: "A line chart with values displayed above each point.",
    visualization: "line",
    data: line({ showLabels: true }),
  },
  {
    slug: "chart-line-label-custom",
    title: "Line Chart — Custom Label",
    description: "A line chart with custom-formatted data labels.",
    visualization: "line",
    data: line({ showLabels: true, customLabels: true }),
  },
  {
    slug: "chart-pie-simple",
    title: "Pie Chart — Simple",
    description: "A straightforward pie chart showing category proportions.",
    visualization: "pie",
    data: pie({ separator: true }),
  },
  {
    slug: "chart-pie-separator-none",
    title: "Pie Chart — No Separator",
    description:
      "A pie chart with seamless segments and no spacing between slices.",
    visualization: "pie",
    data: pie({ separator: false }),
  },
  {
    slug: "chart-pie-label",
    title: "Pie Chart — Label",
    description: "A pie chart with labels positioned around its slices.",
    visualization: "pie",
    data: pie({ showLabels: true }),
  },
  {
    slug: "chart-pie-label-custom",
    title: "Pie Chart — Custom Label",
    description: "A pie chart with category names and values in each label.",
    visualization: "pie",
    data: pie({ showLabels: true, customLabels: true }),
  },
  {
    slug: "chart-pie-label-list",
    title: "Pie Chart — Label List",
    description: "A pie chart with compact labels rendered inside its slices.",
    visualization: "pie",
    data: pie({ showLabels: true, labelList: true }),
  },
  {
    slug: "chart-pie-legend",
    title: "Pie Chart — Legend",
    description: "A pie chart with a color-keyed category legend.",
    visualization: "pie",
    data: pie({ showLegend: true }),
  },
  {
    slug: "chart-pie-donut-active",
    title: "Pie Chart — Active Donut",
    description: "A donut chart that emphasizes one active segment.",
    visualization: "pie",
    data: pie({ donut: true, interactive: true, activeIndex: 1 }),
  },
  {
    slug: "chart-pie-donut-text",
    title: "Pie Chart — Donut with Text",
    description: "A donut chart with a total displayed in its center.",
    visualization: "pie",
    data: pie({ donut: true, centerText: "925" }),
  },
  {
    slug: "chart-pie-stacked",
    title: "Pie Chart — Stacked",
    description: "A concentric pie chart that adds a second comparison ring.",
    visualization: "pie",
    data: pie({ stacked: true }),
  },
  {
    slug: "chart-pie-interactive",
    title: "Pie Chart — Interactive",
    description: "An interactive pie chart with a highlighted active category.",
    visualization: "pie",
    data: pie({ interactive: true, activeIndex: 2, showLegend: true }),
  },
  {
    slug: "chart-radar-default",
    title: "Radar Chart — Default",
    description: "A standard filled radar chart across six dimensions.",
    visualization: "radar",
    data: radar(),
  },
  {
    slug: "chart-radar-lines-only",
    title: "Radar Chart — Lines Only",
    description: "A radar chart drawn as an outline without area fill.",
    visualization: "radar",
    data: radar({ linesOnly: true }),
  },
  {
    slug: "chart-radar-label-custom",
    title: "Radar Chart — Custom Label",
    description: "A radar chart with emphasized custom axis labels.",
    visualization: "radar",
    data: radar({ customLabels: true }),
  },
  {
    slug: "chart-radar-grid-custom",
    title: "Radar Chart — Custom Grid",
    description: "A radar chart with a polygon grid and no radial spokes.",
    visualization: "radar",
    data: radar({ gridType: "polygon", radialLines: false }),
  },
  {
    slug: "chart-radar-grid-none",
    title: "Radar Chart — No Grid",
    description: "A radar chart with its surrounding grid removed.",
    visualization: "radar",
    data: radar({ gridLines: false }),
  },
  {
    slug: "chart-radar-grid-circle",
    title: "Radar Chart — Circle Grid",
    description: "A radar chart arranged on a circular grid.",
    visualization: "radar",
    data: radar({ gridType: "circle" }),
  },
  {
    slug: "chart-radar-grid-circle-no-lines",
    title: "Radar Chart — Circle Grid without Lines",
    description: "A circular radar grid with its radial spokes removed.",
    visualization: "radar",
    data: radar({ gridType: "circle", radialLines: false }),
  },
  {
    slug: "chart-radar-grid-circle-fill",
    title: "Radar Chart — Filled Circle Grid",
    description: "A radar chart with a subtly filled circular grid.",
    visualization: "radar",
    data: radar({ gridType: "circle", gridFill: true }),
  },
  {
    slug: "chart-radar-grid-fill",
    title: "Radar Chart — Filled Grid",
    description: "A radar chart with a subtly filled polygon grid.",
    visualization: "radar",
    data: radar({ gridType: "polygon", gridFill: true }),
  },
  {
    slug: "chart-radar-multiple",
    title: "Radar Chart — Multiple",
    description: "Two radar series compared across the same dimensions.",
    visualization: "radar",
    data: radar({ series: timeSeries }),
  },
  {
    slug: "chart-radar-legend",
    title: "Radar Chart — Legend",
    description: "A multi-series radar chart with a color-keyed legend.",
    visualization: "radar",
    data: radar({ series: timeSeries, showLegend: true }),
  },
  {
    slug: "chart-radial-simple",
    title: "Radial Chart — Simple",
    description: "A simple radial bar chart comparing categories.",
    visualization: "radial",
    data: radial({ showGrid: false }),
  },
  {
    slug: "chart-radial-grid",
    title: "Radial Chart — Grid",
    description: "A radial bar chart with visible background tracks.",
    visualization: "radial",
    data: radial({ showGrid: true }),
  },
  {
    slug: "chart-radial-text",
    title: "Radial Chart — Text",
    description: "A radial chart with a summary value in the center.",
    visualization: "radial",
    data: radial({ centerText: "1,125", showGrid: true }),
  },
  {
    slug: "chart-radial-shape",
    title: "Radial Chart — Shape",
    description: "A radial chart with square-ended bars.",
    visualization: "radial",
    data: radial({ shape: "square" }),
  },
  {
    slug: "chart-radial-stacked",
    title: "Radial Chart — Stacked",
    description: "A radial chart with multiple values stacked into one ring.",
    visualization: "radial",
    data: radial({
      nameKey: "month",
      valueKey: "desktop",
      data: [{ month: "January", desktop: 1260, mobile: 570 }],
      series: timeSeries,
      stacked: true,
      centerText: "1,830",
    }),
  },
];

export const chartVariantExamples = inputs.map(chartExample);
