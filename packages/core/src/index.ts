import { z } from "zod";

const nullableScalarSchema = z.union([z.string(), z.number(), z.null()]);

export const VisualizationTypeSchema = z.enum([
  "metric",
  "area",
  "bar",
  "line",
  "pie",
  "radar",
  "radial",
  "table",
]);
export type VisualizationType = z.infer<typeof VisualizationTypeSchema>;

export const DashboardFooterConfigSchema = z.object({
  text: z.string(),
  href: z.string().optional(),
});
export type DashboardFooterConfig = z.infer<typeof DashboardFooterConfigSchema>;

export const CardDeeplinkConfigSchema = z.object({
  href: z.string(),
  label: z.string().optional(),
});
export type CardDeeplinkConfig = z.infer<typeof CardDeeplinkConfigSchema>;

export const DashboardCardLayoutSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type DashboardCardLayout = z.infer<typeof DashboardCardLayoutSchema>;

export const DashboardCardConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  visualization: VisualizationTypeSchema,
  query: z.string(),
  deeplink: CardDeeplinkConfigSchema.optional(),
  layout: DashboardCardLayoutSchema.optional(),
});
export type DashboardCardConfig = z.infer<typeof DashboardCardConfigSchema>;

export const ApiDashboardCardConfigSchema = DashboardCardConfigSchema.extend({
  layout: DashboardCardLayoutSchema,
});
export type ApiDashboardCardConfig = z.infer<
  typeof ApiDashboardCardConfigSchema
>;

export const PanelDashboardConfigSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  footer: DashboardFooterConfigSchema.optional(),
  cards: z.array(DashboardCardConfigSchema),
});
export type PanelDashboardConfig = z.infer<typeof PanelDashboardConfigSchema>;

export const ApiPanelDashboardConfigSchema = PanelDashboardConfigSchema.extend({
  cards: z.array(ApiDashboardCardConfigSchema),
});
export type ApiPanelDashboardConfig = z.infer<
  typeof ApiPanelDashboardConfigSchema
>;

export const MetricTrendSchema = z.object({
  direction: z.enum(["up", "down", "neutral"]),
  value: z.string(),
  label: z.string().optional(),
});
export type MetricTrend = z.infer<typeof MetricTrendSchema>;

export const MetricCardDataSchema = z.object({
  visualization: z.literal("metric"),
  value: z.union([z.string(), z.number()]),
  label: z.string().optional(),
  helperText: z.string().optional(),
  trend: MetricTrendSchema.optional(),
});
export type MetricCardData = z.infer<typeof MetricCardDataSchema>;

export const ChartSeriesSchema = z.object({
  key: z.string(),
  label: z.string(),
  color: z.string(),
  icon: z.string().optional(),
});
export type ChartSeries = z.infer<typeof ChartSeriesSchema>;

export const ChartDatumSchema = z.record(z.string(), nullableScalarSchema);
export type ChartDatum = z.infer<typeof ChartDatumSchema>;

export const ChartTooltipOptionsSchema = z.object({
  indicator: z.enum(["dot", "line", "dashed", "none"]).optional(),
  hideLabel: z.boolean().optional(),
  label: z.string().optional(),
  labelFormatter: z.literal("date").optional(),
  valueFormatter: z.enum(["compact", "currency", "percent"]).optional(),
  advanced: z.boolean().optional(),
});
export type ChartTooltipOptions = z.infer<typeof ChartTooltipOptionsSchema>;

export const BarChartCardDataSchema = z.object({
  visualization: z.literal("bar"),
  indexKey: z.string(),
  data: z.array(ChartDatumSchema),
  series: z.array(ChartSeriesSchema),
  variant: z.string().optional(),
  layout: z.enum(["vertical", "horizontal"]).optional(),
  stacked: z.boolean().optional(),
  showLabels: z.boolean().optional(),
  customLabels: z.boolean().optional(),
  mixed: z.boolean().optional(),
  activeIndex: z.number().int().optional(),
  interactive: z.boolean().optional(),
  tooltip: ChartTooltipOptionsSchema.optional(),
});
export type BarChartCardData = z.infer<typeof BarChartCardDataSchema>;

export const AreaChartCardDataSchema = z.object({
  visualization: z.literal("area"),
  indexKey: z.string(),
  data: z.array(ChartDatumSchema),
  series: z.array(ChartSeriesSchema),
  variant: z.string().optional(),
  curveType: z.enum(["natural", "linear", "step"]).optional(),
  stacked: z.boolean().optional(),
  stackOffset: z.literal("expand").optional(),
  showLegend: z.boolean().optional(),
  showGradient: z.boolean().optional(),
  showAxes: z.boolean().optional(),
  interactive: z.boolean().optional(),
  tooltip: ChartTooltipOptionsSchema.optional(),
});
export type AreaChartCardData = z.infer<typeof AreaChartCardDataSchema>;

export const LineChartCardDataSchema = z.object({
  visualization: z.literal("line"),
  indexKey: z.string(),
  data: z.array(ChartDatumSchema),
  series: z.array(ChartSeriesSchema),
  variant: z.string().optional(),
  curveType: z.enum(["monotone", "linear", "step"]).optional(),
  showDots: z.boolean().optional(),
  customDots: z.boolean().optional(),
  colorDots: z.boolean().optional(),
  showLabels: z.boolean().optional(),
  customLabels: z.boolean().optional(),
  interactive: z.boolean().optional(),
  tooltip: ChartTooltipOptionsSchema.optional(),
});
export type LineChartCardData = z.infer<typeof LineChartCardDataSchema>;

export const PieChartCardDataSchema = z.object({
  visualization: z.literal("pie"),
  nameKey: z.string(),
  valueKey: z.string(),
  data: z.array(ChartDatumSchema),
  series: z.array(ChartSeriesSchema),
  variant: z.string().optional(),
  separator: z.boolean().optional(),
  showLabels: z.boolean().optional(),
  customLabels: z.boolean().optional(),
  labelList: z.boolean().optional(),
  showLegend: z.boolean().optional(),
  donut: z.boolean().optional(),
  activeIndex: z.number().int().optional(),
  centerText: z.string().optional(),
  stacked: z.boolean().optional(),
  interactive: z.boolean().optional(),
  tooltip: ChartTooltipOptionsSchema.optional(),
});
export type PieChartCardData = z.infer<typeof PieChartCardDataSchema>;

export const RadarChartCardDataSchema = z.object({
  visualization: z.literal("radar"),
  indexKey: z.string(),
  data: z.array(ChartDatumSchema),
  series: z.array(ChartSeriesSchema),
  variant: z.string().optional(),
  showDots: z.boolean().optional(),
  linesOnly: z.boolean().optional(),
  customLabels: z.boolean().optional(),
  gridType: z.enum(["polygon", "circle"]).optional(),
  gridFill: z.boolean().optional(),
  gridLines: z.boolean().optional(),
  radialLines: z.boolean().optional(),
  showLegend: z.boolean().optional(),
  tooltip: ChartTooltipOptionsSchema.optional(),
});
export type RadarChartCardData = z.infer<typeof RadarChartCardDataSchema>;

export const RadialChartCardDataSchema = z.object({
  visualization: z.literal("radial"),
  nameKey: z.string(),
  valueKey: z.string(),
  data: z.array(ChartDatumSchema),
  series: z.array(ChartSeriesSchema),
  variant: z.string().optional(),
  showLabel: z.boolean().optional(),
  showGrid: z.boolean().optional(),
  centerText: z.string().optional(),
  shape: z.enum(["round", "square"]).optional(),
  stacked: z.boolean().optional(),
  tooltip: ChartTooltipOptionsSchema.optional(),
});
export type RadialChartCardData = z.infer<typeof RadialChartCardDataSchema>;

export const TableColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  align: z.enum(["left", "right"]).optional(),
});
export type TableColumn = z.infer<typeof TableColumnSchema>;

export const TableRowSchema = z.record(z.string(), nullableScalarSchema);
export type TableRow = z.infer<typeof TableRowSchema>;

export const TableCardDataSchema = z.object({
  visualization: z.literal("table"),
  columns: z.array(TableColumnSchema),
  rows: z.array(TableRowSchema),
});
export type TableCardData = z.infer<typeof TableCardDataSchema>;

export const PanelCardPayloadSchema = z.discriminatedUnion("visualization", [
  MetricCardDataSchema,
  AreaChartCardDataSchema,
  BarChartCardDataSchema,
  LineChartCardDataSchema,
  PieChartCardDataSchema,
  RadarChartCardDataSchema,
  RadialChartCardDataSchema,
  TableCardDataSchema,
]);
export type PanelCardPayload = z.infer<typeof PanelCardPayloadSchema>;

export const SourceDataTableSchema = z.object({
  columns: z.array(TableColumnSchema),
  rows: z.array(TableRowSchema),
});
export type SourceDataTable = z.infer<typeof SourceDataTableSchema>;

const panelCardDataSuccessSchema = z.object({
  status: z.literal("success"),
  data: PanelCardPayloadSchema,
  sourceData: SourceDataTableSchema.optional(),
});
const panelCardDataEmptySchema = z.object({
  status: z.literal("empty"),
  message: z.string().optional(),
});
const panelCardDataErrorSchema = z.object({
  status: z.literal("error"),
  message: z.string(),
});

export const PanelCardDataResponseSchema = z.discriminatedUnion("status", [
  panelCardDataSuccessSchema,
  panelCardDataEmptySchema,
  panelCardDataErrorSchema,
]);
export type PanelCardDataResponse = z.infer<typeof PanelCardDataResponseSchema>;

export const PanelCardDataWithSourceResponseSchema = z.discriminatedUnion(
  "status",
  [
    panelCardDataSuccessSchema.extend({ sourceData: SourceDataTableSchema }),
    panelCardDataEmptySchema,
    panelCardDataErrorSchema,
  ],
);
export type PanelCardDataWithSourceResponse = z.infer<
  typeof PanelCardDataWithSourceResponseSchema
>;

export const DashboardSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  isDefault: z.boolean(),
});
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;

export const DashboardDocumentSchema = z.object({
  id: z.string(),
  revision: z.string(),
  config: ApiPanelDashboardConfigSchema,
});
export type DashboardDocument = z.infer<typeof DashboardDocumentSchema>;

export const DashboardBootstrapRequestSchema = z.object({
  dashboardId: z.string().optional(),
});
export type DashboardBootstrapRequest = z.infer<
  typeof DashboardBootstrapRequestSchema
>;

export const DashboardBootstrapResponseSchema = z.object({
  dashboards: z.array(DashboardSummarySchema),
  dashboard: DashboardDocumentSchema,
});
export type DashboardBootstrapResponse = z.infer<
  typeof DashboardBootstrapResponseSchema
>;

export const DashboardApiErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "DASHBOARD_NOT_FOUND",
  "DASHBOARD_LOAD_FAILED",
  "DASHBOARD_CARD_NOT_FOUND",
  "CARD_QUERY_FAILED",
  "REVISION_CONFLICT",
  "CARD_ALREADY_ADDED",
]);
export type DashboardApiErrorCode = z.infer<typeof DashboardApiErrorCodeSchema>;

export const DashboardApiErrorSchema = z.object({
  error: z.object({
    code: DashboardApiErrorCodeSchema,
    message: z.string(),
  }),
});
export type DashboardApiError = z.infer<typeof DashboardApiErrorSchema>;

export const UpdateDashboardLayoutRequestSchema = z.object({
  revision: z.string(),
  cards: z.array(
    z.object({
      id: z.string(),
      ...DashboardCardLayoutSchema.shape,
    }),
  ),
});
export type UpdateDashboardLayoutRequest = z.infer<
  typeof UpdateDashboardLayoutRequestSchema
>;
export type DashboardLayoutItem = UpdateDashboardLayoutRequest["cards"][number];

export const UpdateDashboardCardRequestSchema = z.object({
  revision: z.string(),
  name: z.string(),
});
export type UpdateDashboardCardRequest = z.infer<
  typeof UpdateDashboardCardRequestSchema
>;

export const CardLibraryItemSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  visualization: VisualizationTypeSchema,
  defaultLayout: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  addedCardId: z.string().optional(),
});
export type CardLibraryItem = z.infer<typeof CardLibraryItemSchema>;

export const CardLibraryResponseSchema = z.object({
  items: z.array(CardLibraryItemSchema),
});
export type CardLibraryResponse = z.infer<typeof CardLibraryResponseSchema>;

export const AddDashboardCardRequestSchema = z.object({
  revision: z.string(),
  libraryItemKey: z.string(),
});
export type AddDashboardCardRequest = z.infer<
  typeof AddDashboardCardRequestSchema
>;

export const RemoveDashboardCardRequestSchema = z.object({
  revision: z.string(),
});
export type RemoveDashboardCardRequest = z.infer<
  typeof RemoveDashboardCardRequestSchema
>;

export const DashboardCardMutationResponseSchema = z.object({
  dashboard: DashboardDocumentSchema,
  cardLibrary: CardLibraryResponseSchema,
});
export type DashboardCardMutationResponse = z.infer<
  typeof DashboardCardMutationResponseSchema
>;

export const DASHBOARD_GRID_COLUMNS = 4;

export type DashboardLayoutValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

export function validateDashboardLayout(
  cards: readonly DashboardLayoutItem[],
  expectedCardIds: readonly string[],
): DashboardLayoutValidationResult {
  const errors: string[] = [];
  const cardIds = cards.map((card) => card.id);
  const uniqueCardIds = new Set(cardIds);

  if (uniqueCardIds.size !== cardIds.length) {
    errors.push("Card IDs must be unique");
  }

  const expectedIds = new Set(expectedCardIds);
  if (
    cards.length !== expectedCardIds.length ||
    [...uniqueCardIds].some((cardId) => !expectedIds.has(cardId)) ||
    [...expectedIds].some((cardId) => !uniqueCardIds.has(cardId))
  ) {
    errors.push("Layout must contain exactly the Dashboard's Cards");
  }

  for (const card of cards) {
    if (card.x + card.width > DASHBOARD_GRID_COLUMNS) {
      errors.push(
        `Card ${card.id} extends beyond the ${DASHBOARD_GRID_COLUMNS}-column grid`,
      );
    }
  }

  for (let index = 0; index < cards.length; index += 1) {
    const first = cards[index];

    for (
      let otherIndex = index + 1;
      otherIndex < cards.length;
      otherIndex += 1
    ) {
      const second = cards[otherIndex];

      if (first && second && rectanglesOverlap(first, second)) {
        errors.push(`Cards ${first.id} and ${second.id} overlap`);
      }
    }
  }

  return errors.length ? { valid: false, errors } : { valid: true };
}

function rectanglesOverlap(
  first: DashboardCardLayout,
  second: DashboardCardLayout,
) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}
