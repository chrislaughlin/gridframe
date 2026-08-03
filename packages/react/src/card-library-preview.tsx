import type { PanelCardPayload, VisualizationType } from "@gridframe/core";
import { CardVisualization } from "./card-visualization";

type ChartVisualizationType = Exclude<VisualizationType, "metric" | "table">;

const chartSeries = [
  { key: "primary", label: "Primary", color: "var(--chart-1)" },
  { key: "secondary", label: "Secondary", color: "var(--chart-2)" },
];

const timeSeries = [
  { period: "Jan", primary: 32, secondary: 18 },
  { period: "Feb", primary: 46, secondary: 28 },
  { period: "Mar", primary: 39, secondary: 35 },
  { period: "Apr", primary: 58, secondary: 31 },
  { period: "May", primary: 52, secondary: 43 },
  { period: "Jun", primary: 68, secondary: 49 },
];

const chartPreviews = {
  area: {
    visualization: "area",
    indexKey: "period",
    data: timeSeries,
    series: chartSeries,
    showAxes: false,
  },
  bar: {
    visualization: "bar",
    indexKey: "period",
    data: timeSeries.slice(0, 5),
    series: chartSeries.slice(0, 1),
  },
  line: {
    visualization: "line",
    indexKey: "period",
    data: timeSeries,
    series: chartSeries,
    showDots: false,
  },
  pie: {
    visualization: "pie",
    nameKey: "segment",
    valueKey: "value",
    data: [
      { segment: "Direct", value: 42 },
      { segment: "Search", value: 31 },
      { segment: "Referral", value: 18 },
      { segment: "Other", value: 9 },
    ],
    series: [
      { key: "Direct", label: "Direct", color: "var(--chart-1)" },
      { key: "Search", label: "Search", color: "var(--chart-2)" },
      { key: "Referral", label: "Referral", color: "var(--chart-3)" },
      { key: "Other", label: "Other", color: "var(--chart-4)" },
    ],
    donut: true,
    showLegend: false,
  },
  radar: {
    visualization: "radar",
    indexKey: "dimension",
    data: [
      { dimension: "A", primary: 72 },
      { dimension: "B", primary: 48 },
      { dimension: "C", primary: 81 },
      { dimension: "D", primary: 61 },
      { dimension: "E", primary: 88 },
    ],
    series: chartSeries.slice(0, 1),
  },
  radial: {
    visualization: "radial",
    nameKey: "segment",
    valueKey: "value",
    data: [
      { segment: "Complete", value: 74 },
      { segment: "Remaining", value: 26 },
    ],
    series: [
      { key: "Complete", label: "Complete", color: "var(--chart-1)" },
      { key: "Remaining", label: "Remaining", color: "var(--chart-2)" },
    ],
    centerText: "74%",
  },
} satisfies Record<ChartVisualizationType, PanelCardPayload>;

function CardLibraryPreview({
  visualization,
}: {
  visualization: VisualizationType;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none flex h-40 min-w-0 select-none items-stretch overflow-hidden rounded-md border border-border bg-muted/30 p-3"
      data-card-library-preview={visualization}
      inert
    >
      {visualization === "metric" ? (
        <MetricPreview />
      ) : visualization === "table" ? (
        <TablePreview />
      ) : (
        <CardVisualization data={chartPreviews[visualization]} />
      )}
    </div>
  );
}

function MetricPreview() {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
      <span className="text-xs text-muted-foreground">Total value</span>
      <span className="truncate text-3xl font-semibold tracking-tight text-foreground">
        24.8K
      </span>
      <span className="w-fit rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
        +12.4%
      </span>
    </div>
  );
}

function TablePreview() {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 text-xs">
      <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-border pb-2 font-medium text-muted-foreground">
        <span>Name</span>
        <span>Value</span>
      </div>
      {[
        ["Alpha", "1,240"],
        ["Beta", "980"],
        ["Gamma", "760"],
      ].map(([name, value]) => (
        <div
          className="grid grid-cols-[1fr_auto] gap-3 border-b border-border/70 pb-2 last:border-0 last:pb-0"
          key={name}
        >
          <span className="truncate text-foreground">{name}</span>
          <span className="text-muted-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}

export { CardLibraryPreview };
