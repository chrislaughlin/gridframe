export type VisualizationType = "metric" | "bar" | "line" | "table";

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
};

export type ChartDatum = Record<string, string | number | null>;

export type BarChartCardData = {
  visualization: "bar";
  indexKey: string;
  data: ChartDatum[];
  series: ChartSeries[];
};

export type LineChartCardData = {
  visualization: "line";
  indexKey: string;
  data: ChartDatum[];
  series: ChartSeries[];
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
  | BarChartCardData
  | LineChartCardData
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
