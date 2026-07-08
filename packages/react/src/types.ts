export type VisualizationType =
  | "metric"
  | "area"
  | "bar"
  | "line"
  | "pie"
  | "radar"
  | "radial"
  | "table";

export type DashboardFooterConfig = {
  text: string;
  href?: string;
};

export type CardDeeplinkConfig = {
  href: string;
  label?: string;
};

export type DashboardCardConfig = {
  id: string;
  name: string;
  visualization: VisualizationType;
  query: string;
  deeplink?: CardDeeplinkConfig;
};

export type PanelDashboardConfig = {
  title: string;
  description?: string;
  footer?: DashboardFooterConfig;
  cards: DashboardCardConfig[];
};

export type MetricTrend = {
  direction: "up" | "down" | "neutral";
  value: string;
  label?: string;
};

export type MetricCardData = {
  visualization: "metric";
  value: string | number;
  label?: string;
  helperText?: string;
  trend?: MetricTrend;
};

export type ChartSeries = {
  key: string;
  label: string;
  color: string;
  icon?: string;
};

export type ChartDatum = Record<string, string | number | null>;

export type ChartTooltipOptions = {
  indicator?: "dot" | "line" | "dashed" | "none";
  hideLabel?: boolean;
  label?: string;
  labelFormatter?: "date";
  valueFormatter?: "compact" | "currency" | "percent";
  advanced?: boolean;
};

export type BarChartCardData = {
  visualization: "bar";
  indexKey: string;
  data: ChartDatum[];
  series: ChartSeries[];
  variant?: string;
  layout?: "vertical" | "horizontal";
  stacked?: boolean;
  showLabels?: boolean;
  customLabels?: boolean;
  mixed?: boolean;
  activeIndex?: number;
  tooltip?: ChartTooltipOptions;
};

export type AreaChartCardData = {
  visualization: "area";
  indexKey: string;
  data: ChartDatum[];
  series: ChartSeries[];
  variant?: string;
  curveType?: "natural" | "linear" | "step";
  stacked?: boolean;
  stackOffset?: "expand";
  showLegend?: boolean;
  showGradient?: boolean;
  showAxes?: boolean;
  interactive?: boolean;
  tooltip?: ChartTooltipOptions;
};

export type LineChartCardData = {
  visualization: "line";
  indexKey: string;
  data: ChartDatum[];
  series: ChartSeries[];
  variant?: string;
  curveType?: "monotone" | "linear" | "step";
  showDots?: boolean;
  customDots?: boolean;
  colorDots?: boolean;
  showLabels?: boolean;
  customLabels?: boolean;
  interactive?: boolean;
  tooltip?: ChartTooltipOptions;
};

export type PieChartCardData = {
  visualization: "pie";
  nameKey: string;
  valueKey: string;
  data: ChartDatum[];
  series: ChartSeries[];
  variant?: string;
  separator?: boolean;
  showLabels?: boolean;
  customLabels?: boolean;
  labelList?: boolean;
  showLegend?: boolean;
  donut?: boolean;
  activeIndex?: number;
  centerText?: string;
  stacked?: boolean;
  interactive?: boolean;
  tooltip?: ChartTooltipOptions;
};

export type RadarChartCardData = {
  visualization: "radar";
  indexKey: string;
  data: ChartDatum[];
  series: ChartSeries[];
  variant?: string;
  showDots?: boolean;
  linesOnly?: boolean;
  customLabels?: boolean;
  gridType?: "polygon" | "circle";
  gridFill?: boolean;
  gridLines?: boolean;
  radialLines?: boolean;
  showLegend?: boolean;
  tooltip?: ChartTooltipOptions;
};

export type RadialChartCardData = {
  visualization: "radial";
  nameKey: string;
  valueKey: string;
  data: ChartDatum[];
  series: ChartSeries[];
  variant?: string;
  showLabel?: boolean;
  showGrid?: boolean;
  centerText?: string;
  shape?: "round" | "square";
  stacked?: boolean;
  tooltip?: ChartTooltipOptions;
};

export type TableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

export type TableRow = Record<string, string | number | null>;

export type TableCardData = {
  visualization: "table";
  columns: TableColumn[];
  rows: TableRow[];
};

export type PanelCardPayload =
  | MetricCardData
  | AreaChartCardData
  | BarChartCardData
  | LineChartCardData
  | PieChartCardData
  | RadarChartCardData
  | RadialChartCardData
  | TableCardData;

export type PanelCardDataResponse =
  | {
      status: "success";
      data: PanelCardPayload;
    }
  | {
      status: "empty";
      message?: string;
    }
  | {
      status: "error";
      message: string;
    };
