import { z } from "zod";

export const DashboardAggregationSchema = z.enum([
  "sum",
  "average",
  "count",
  "min",
  "max",
]);
export type DashboardAggregation = z.infer<typeof DashboardAggregationSchema>;

export const DashboardFilterOperatorSchema = z.enum([
  "equals",
  "notEquals",
  "in",
  "notIn",
  "greaterThan",
  "greaterThanOrEqual",
  "lessThan",
  "lessThanOrEqual",
  "between",
  "contains",
]);
export type DashboardFilterOperator = z.infer<
  typeof DashboardFilterOperatorSchema
>;

export const DashboardMetricSchema = z
  .object({
    field: z.string().min(1),
    aggregation: DashboardAggregationSchema.optional(),
    alias: z.string().min(1).optional(),
  })
  .strict();
export type DashboardMetric = z.infer<typeof DashboardMetricSchema>;

export const DashboardFilterSchema = z
  .object({
    field: z.string().min(1),
    operator: DashboardFilterOperatorSchema,
    value: z.json(),
  })
  .strict();
export type DashboardFilter = z.infer<typeof DashboardFilterSchema>;

export const DashboardTimeConfigSchema = z
  .object({
    field: z.string().min(1),
    range: z.string().min(1).optional(),
    grain: z
      .enum(["hour", "day", "week", "month", "quarter", "year"])
      .optional(),
  })
  .strict();
export type DashboardTimeConfig = z.infer<typeof DashboardTimeConfigSchema>;

export const DashboardSortSchema = z
  .object({
    field: z.string().min(1),
    direction: z.enum(["asc", "desc"]),
  })
  .strict();
export type DashboardSort = z.infer<typeof DashboardSortSchema>;

export const DashboardCardDataConfigSchema = z
  .object({
    metrics: z.array(DashboardMetricSchema).optional(),
    dimensions: z.array(z.string().min(1)).optional(),
    filters: z.array(DashboardFilterSchema).optional(),
    time: DashboardTimeConfigSchema.optional(),
    sort: z.array(DashboardSortSchema).optional(),
    limit: z.number().int().positive().max(10_000).optional(),
  })
  .strict();
export type DashboardCardDataConfig = z.infer<
  typeof DashboardCardDataConfigSchema
>;

export const DashboardGlobalFilterSchema = DashboardFilterSchema.omit({
  value: true,
}).extend({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  value: z.json().optional(),
});
export type DashboardGlobalFilter = z.infer<typeof DashboardGlobalFilterSchema>;
