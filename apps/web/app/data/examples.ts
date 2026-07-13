import type { PanelCardPayload } from "@gridframe/core";
import { chartVariantExamples } from "./chart-variant-examples";

export type ExampleDefinition = {
  slug: string;
  title: string;
  description: string;
  visualization: string;
  data: PanelCardPayload;
  code: string;
};

export const examples: ExampleDefinition[] = [
  {
    slug: "metric",
    title: "Metric",
    description:
      "A single headline number with optional trend indicator and helper text. Ideal for KPIs and summary statistics.",
    visualization: "metric",
    data: {
      visualization: "metric",
      value: 128_500,
      label: "Revenue",
      helperText: "Across all channels",
      trend: { direction: "up", value: "12%", label: "vs last month" },
    },
    code: `{
  visualization: "metric",
  value: 128_500,
  label: "Revenue",
  helperText: "Across all channels",
  trend: { direction: "up", value: "12%" },
}`,
  },
  {
    slug: "chart-bar-default",
    title: "Bar Chart — Default",
    description:
      "Vertical or horizontal bars for comparing categories. Supports stacked, mixed, and labelled variants.",
    visualization: "bar",
    data: {
      visualization: "bar",
      indexKey: "region",
      data: [
        { region: "North America", revenue: 62_000 },
        { region: "Europe", revenue: 41_000 },
        { region: "Asia Pacific", revenue: 55_000 },
        { region: "Latin America", revenue: 28_000 },
      ],
      series: [{ key: "revenue", label: "Revenue", color: "var(--chart-1)" }],
      tooltip: { valueFormatter: "currency" },
    },
    code: `{
  visualization: "bar",
  indexKey: "region",
  data: [
    { region: "North America", revenue: 62_000 },
    { region: "Europe", revenue: 41_000 },
    { region: "Asia Pacific", revenue: 55_000 },
    { region: "Latin America", revenue: 28_000 },
  ],
  series: [
    { key: "revenue", label: "Revenue", color: "var(--chart-1)" },
  ],
}`,
  },
  {
    slug: "chart-area-default",
    title: "Area Chart — Default",
    description:
      "Filled area charts for showing volume over time. Supports stacking, gradients, and multiple series.",
    visualization: "area",
    data: {
      visualization: "area",
      indexKey: "month",
      data: [
        { month: "Jan", revenue: 45_000, costs: 32_000 },
        { month: "Feb", revenue: 52_000, costs: 34_000 },
        { month: "Mar", revenue: 48_000, costs: 31_000 },
        { month: "Apr", revenue: 61_000, costs: 35_000 },
        { month: "May", revenue: 55_000, costs: 33_000 },
        { month: "Jun", revenue: 67_000, costs: 36_000 },
      ],
      series: [
        { key: "revenue", label: "Revenue", color: "var(--chart-1)" },
        { key: "costs", label: "Costs", color: "var(--chart-2)" },
      ],
      showLegend: true,
      showGradient: true,
    },
    code: `{
  visualization: "area",
  indexKey: "month",
  data: [
    { month: "Jan", revenue: 45_000, costs: 32_000 },
    { month: "Feb", revenue: 52_000, costs: 34_000 },
    ...
  ],
  series: [
    { key: "revenue", label: "Revenue", color: "var(--chart-1)" },
    { key: "costs", label: "Costs", color: "var(--chart-2)" },
  ],
  showLegend: true,
  showGradient: true,
}`,
  },
  {
    slug: "chart-line-default",
    title: "Line Chart — Default",
    description:
      "Line charts for trends and progressions. Supports dots, labels, and multiple series with different curve types.",
    visualization: "line",
    data: {
      visualization: "line",
      indexKey: "month",
      data: [
        { month: "Jan", users: 1_200 },
        { month: "Feb", users: 1_800 },
        { month: "Mar", users: 2_400 },
        { month: "Apr", users: 2_100 },
        { month: "May", users: 3_200 },
        { month: "Jun", users: 3_800 },
      ],
      series: [
        { key: "users", label: "Active Users", color: "var(--chart-2)" },
      ],
      showDots: true,
      interactive: true,
    },
    code: `{
  visualization: "line",
  indexKey: "month",
  data: [
    { month: "Jan", users: 1_200 },
    { month: "Feb", users: 1_800 },
    ...
  ],
  series: [
    { key: "users", label: "Active Users", color: "var(--chart-2)" },
  ],
  showDots: true,
  interactive: true,
}`,
  },
  {
    slug: "chart-pie-donut",
    title: "Pie Chart — Donut",
    description:
      "Pie and donut charts for showing proportions. Supports legends, labels, active states, and center text.",
    visualization: "pie",
    data: {
      visualization: "pie",
      nameKey: "source",
      valueKey: "visits",
      data: [
        { source: "Direct", visits: 3_500 },
        { source: "Organic Search", visits: 4_200 },
        { source: "Social Media", visits: 2_800 },
        { source: "Referral", visits: 1_500 },
      ],
      series: [
        { key: "Direct", label: "Direct", color: "var(--chart-1)" },
        {
          key: "Organic Search",
          label: "Organic",
          color: "var(--chart-2)",
        },
        {
          key: "Social Media",
          label: "Social",
          color: "var(--chart-3)",
        },
        { key: "Referral", label: "Referral", color: "var(--chart-4)" },
      ],
      showLegend: true,
      donut: true,
    },
    code: `{
  visualization: "pie",
  nameKey: "source",
  valueKey: "visits",
  data: [
    { source: "Direct", visits: 3_500 },
    { source: "Organic Search", visits: 4_200 },
    { source: "Social Media", visits: 2_800 },
    { source: "Referral", visits: 1_500 },
  ],
  series: [
    { key: "Direct", label: "Direct", color: "var(--chart-1)" },
    ...
  ],
  donut: true,
}`,
  },
  {
    slug: "chart-radar-dots",
    title: "Radar Chart — Dots",
    description:
      "Radar charts for comparing multiple dimensions. Supports polygon and circle grids with dot and line variants.",
    visualization: "radar",
    data: {
      visualization: "radar",
      indexKey: "dimension",
      data: [
        { dimension: "Performance", score: 85 },
        { dimension: "Reliability", score: 92 },
        { dimension: "Security", score: 78 },
        { dimension: "Usability", score: 88 },
        { dimension: "Scalability", score: 75 },
        { dimension: "Support", score: 90 },
      ],
      series: [{ key: "score", label: "Score", color: "var(--chart-1)" }],
      showDots: true,
      gridType: "polygon",
    },
    code: `{
  visualization: "radar",
  indexKey: "dimension",
  data: [
    { dimension: "Performance", score: 85 },
    { dimension: "Reliability", score: 92 },
    { dimension: "Security", score: 78 },
    ...
  ],
  series: [
    { key: "score", label: "Score", color: "var(--chart-1)" },
  ],
  gridType: "polygon",
}`,
  },
  {
    slug: "chart-radial-label",
    title: "Radial Chart — Label",
    description:
      "Radial bar charts for goal progress and comparisons. Supports stacked, labelled, and rounded shapes.",
    visualization: "radial",
    data: {
      visualization: "radial",
      nameKey: "goal",
      valueKey: "progress",
      data: [
        { goal: "Revenue", progress: 78 },
        { goal: "Users", progress: 92 },
        { goal: "Retention", progress: 65 },
      ],
      series: [
        { key: "Revenue", label: "Revenue", color: "var(--chart-1)" },
        { key: "Users", label: "Users", color: "var(--chart-2)" },
        { key: "Retention", label: "Retention", color: "var(--chart-3)" },
      ],
      showLabel: true,
    },
    code: `{
  visualization: "radial",
  nameKey: "goal",
  valueKey: "progress",
  data: [
    { goal: "Revenue", progress: 78 },
    { goal: "Users", progress: 92 },
    { goal: "Retention", progress: 65 },
  ],
  series: [
    { key: "Revenue", label: "Revenue", color: "var(--chart-1)" },
    ...
  ],
  showLabel: true,
}`,
  },
  {
    slug: "table",
    title: "Table",
    description:
      "Data tables with auto-detected column alignment. Supports any column type with type-safe row data.",
    visualization: "table",
    data: {
      visualization: "table",
      columns: [
        { key: "name", label: "Name", align: "left" },
        { key: "role", label: "Role", align: "left" },
        { key: "status", label: "Status", align: "left" },
        { key: "revenue", label: "Revenue", align: "right" },
      ],
      rows: [
        {
          name: "Alice Chen",
          role: "Engineering",
          status: "Active",
          revenue: 42_500,
        },
        {
          name: "Bob Williams",
          role: "Design",
          status: "Active",
          revenue: 38_200,
        },
        {
          name: "Carol Martinez",
          role: "Product",
          status: "On Leave",
          revenue: 35_800,
        },
        {
          name: "David Kim",
          role: "Engineering",
          status: "Active",
          revenue: 44_100,
        },
      ],
    },
    code: `{
  visualization: "table",
  columns: [
    { key: "name", label: "Name", align: "left" },
    { key: "role", label: "Role", align: "left" },
    { key: "status", label: "Status", align: "left" },
    { key: "revenue", label: "Revenue", align: "right" },
  ],
  rows: [
    { name: "Alice Chen", role: "Engineering", status: "Active", revenue: 42_500 },
    ...
  ],
}`,
  },
  ...chartVariantExamples,
];

export function getExample(slug: string): ExampleDefinition | undefined {
  const resolvedSlug = legacyExampleAliases[slug] ?? slug;
  return examples.find((example) => example.slug === resolvedSlug);
}

const legacyExampleAliases: Record<string, string> = {
  area: "chart-area-default",
  bar: "chart-bar-default",
  line: "chart-line-default",
  pie: "chart-pie-donut",
  radar: "chart-radar-dots",
  radial: "chart-radial-label",
};

export const heroCards: PanelCardPayload[] = [
  {
    visualization: "metric",
    value: 128_500,
    label: "Revenue",
    helperText: "Across all channels",
    trend: { direction: "up", value: "12%" },
  },
  {
    visualization: "metric",
    value: 3_847,
    label: "Active Users",
    trend: { direction: "up", value: "8.3%" },
  },
  {
    visualization: "metric",
    value: "94.2%",
    label: "Uptime",
    trend: { direction: "up", value: "0.4%" },
  },
  {
    visualization: "bar",
    indexKey: "region",
    data: [
      { region: "North America", revenue: 62_000 },
      { region: "Europe", revenue: 41_000 },
      { region: "Asia Pacific", revenue: 55_000 },
      { region: "Latin America", revenue: 28_000 },
    ],
    series: [{ key: "revenue", label: "Revenue", color: "var(--chart-1)" }],
    tooltip: { valueFormatter: "currency" },
  },
  {
    visualization: "area",
    indexKey: "month",
    data: [
      { month: "Jan", revenue: 45_000, costs: 32_000 },
      { month: "Feb", revenue: 52_000, costs: 34_000 },
      { month: "Mar", revenue: 48_000, costs: 31_000 },
      { month: "Apr", revenue: 61_000, costs: 35_000 },
      { month: "May", revenue: 55_000, costs: 33_000 },
      { month: "Jun", revenue: 67_000, costs: 36_000 },
    ],
    series: [
      { key: "revenue", label: "Revenue", color: "var(--chart-1)" },
      { key: "costs", label: "Costs", color: "var(--chart-2)" },
    ],
    showLegend: true,
    showGradient: true,
  },
  {
    visualization: "pie",
    nameKey: "source",
    valueKey: "visits",
    data: [
      { source: "Direct", visits: 3_500 },
      { source: "Organic", visits: 4_200 },
      { source: "Social", visits: 2_800 },
      { source: "Referral", visits: 1_500 },
    ],
    series: [
      { key: "Direct", label: "Direct", color: "var(--chart-1)" },
      { key: "Organic", label: "Organic", color: "var(--chart-2)" },
      { key: "Social", label: "Social", color: "var(--chart-3)" },
      { key: "Referral", label: "Referral", color: "var(--chart-4)" },
    ],
    donut: true,
    showLegend: true,
  },
  {
    visualization: "table",
    columns: [
      { key: "order", label: "Order", align: "left" },
      { key: "customer", label: "Customer", align: "left" },
      { key: "amount", label: "Amount", align: "right" },
      { key: "status", label: "Status", align: "left" },
    ],
    rows: [
      {
        order: "ORD-7291",
        customer: "Acme Corp",
        amount: 2_400,
        status: "Delivered",
      },
      {
        order: "ORD-7292",
        customer: "Globex Inc",
        amount: 890,
        status: "Processing",
      },
      {
        order: "ORD-7293",
        customer: "Initech",
        amount: 3_100,
        status: "Shipped",
      },
      {
        order: "ORD-7294",
        customer: "Umbrella Co",
        amount: 1_650,
        status: "Delivered",
      },
    ],
  },
];
