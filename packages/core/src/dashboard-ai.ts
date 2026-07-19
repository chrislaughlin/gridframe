import { z } from "zod";

import {
  DashboardAggregationSchema,
  DashboardCardDataConfigSchema,
  DashboardFilterOperatorSchema,
  DashboardGlobalFilterSchema,
} from "./dashboard-card-data";

export const AIDataFieldSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    description: z.string().optional(),
    type: z.enum([
      "string",
      "number",
      "boolean",
      "date",
      "datetime",
      "category",
    ]),
    role: z.enum(["metric", "dimension", "time"]).optional(),
    allowedAggregations: z.array(DashboardAggregationSchema).optional(),
    filterable: z.boolean().optional(),
    sortable: z.boolean().optional(),
    sensitive: z.boolean().optional(),
  })
  .strict();
export type AIDataField = z.infer<typeof AIDataFieldSchema>;

export const AIVisualizationSchema = z.enum([
  "metric",
  "line-chart",
  "area-chart",
  "bar-chart",
  "pie-chart",
  "table",
  "text",
]);
export type AIVisualization = z.infer<typeof AIVisualizationSchema>;

export const AICardDefinitionSchema = z
  .object({
    key: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    visualization: AIVisualizationSchema,
    tags: z.array(z.string().min(1)),
    questionsAnswered: z.array(z.string().min(1)),
    requiredDataShape: z
      .object({
        minMetrics: z.number().int().nonnegative().optional(),
        maxMetrics: z.number().int().nonnegative().optional(),
        minDimensions: z.number().int().nonnegative().optional(),
        maxDimensions: z.number().int().nonnegative().optional(),
        supportsTimeSeries: z.boolean().optional(),
      })
      .strict(),
    supportedFilters: z.array(DashboardFilterOperatorSchema).optional(),
    requiredPermissions: z.array(z.string().min(1)).optional(),
    defaultLayout: z
      .object({
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
      .strict(),
  })
  .strict();
export type AICardDefinition = z.infer<typeof AICardDefinitionSchema>;

export const ProposedCardSchema = z
  .object({
    id: z.string().min(1).optional(),
    cardKey: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    data: DashboardCardDataConfigSchema,
    layout: z
      .object({
        x: z.number().int().nonnegative().optional(),
        y: z.number().int().nonnegative().optional(),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
      .strict(),
  })
  .strict();
export type ProposedCard = z.infer<typeof ProposedCardSchema>;

const CreateDashboardActionSchema = z
  .object({
    type: z.literal("createDashboard"),
    title: z.string().min(1),
    description: z.string().optional(),
  })
  .strict();

const UpdateDashboardMetadataActionSchema = z
  .object({
    type: z.literal("updateDashboardMetadata"),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
  })
  .strict()
  .refine(
    (action) => action.title !== undefined || action.description !== undefined,
    {
      message: "A metadata update must change at least one field",
    },
  );

const AddCardActionSchema = z
  .object({
    type: z.literal("addCard"),
    card: ProposedCardSchema,
  })
  .strict();

const UpdateCardActionSchema = z
  .object({
    type: z.literal("updateCard"),
    cardId: z.string().min(1),
    card: ProposedCardSchema.omit({ id: true }),
  })
  .strict();

const RemoveCardActionSchema = z
  .object({
    type: z.literal("removeCard"),
    cardId: z.string().min(1),
  })
  .strict();

const MoveCardActionSchema = z
  .object({
    type: z.literal("moveCard"),
    cardId: z.string().min(1),
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
  })
  .strict();

const ResizeCardActionSchema = z
  .object({
    type: z.literal("resizeCard"),
    cardId: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .strict();

const AddGlobalFilterActionSchema = z
  .object({
    type: z.literal("addGlobalFilter"),
    filter: DashboardGlobalFilterSchema.partial({ id: true }),
  })
  .strict();

const RemoveGlobalFilterActionSchema = z
  .object({
    type: z.literal("removeGlobalFilter"),
    filterId: z.string().min(1),
  })
  .strict();

export const DashboardActionSchema = z.discriminatedUnion("type", [
  CreateDashboardActionSchema,
  UpdateDashboardMetadataActionSchema,
  AddCardActionSchema,
  UpdateCardActionSchema,
  RemoveCardActionSchema,
  MoveCardActionSchema,
  ResizeCardActionSchema,
  AddGlobalFilterActionSchema,
  RemoveGlobalFilterActionSchema,
]);
export type DashboardAction = z.infer<typeof DashboardActionSchema>;

export const DashboardProposalSchema = z
  .object({
    version: z.literal(1),
    title: z.string().min(1),
    description: z.string().optional(),
    intent: z
      .object({
        domain: z.string().optional(),
        objective: z.string().min(1),
        audience: z.string().optional(),
      })
      .strict(),
    actions: z.array(DashboardActionSchema),
    assumptions: z.array(z.string()),
    missingInformation: z.array(z.string()),
    explanation: z.string().optional(),
  })
  .strict();
export type DashboardProposal = z.infer<typeof DashboardProposalSchema>;

export const DashboardProposalValidationIssueCodeSchema = z.enum([
  "CREATE_DASHBOARD_REQUIRED",
  "DASHBOARD_ALREADY_EXISTS",
  "DUPLICATE_CARD_KEY",
  "DUPLICATE_FILTER_ID",
  "INVALID_DATA_SHAPE",
  "INVALID_JSON",
  "INVALID_LAYOUT",
  "INVALID_PROPOSAL",
  "MISSING_INFORMATION",
  "UNKNOWN_CARD_ID",
  "UNKNOWN_CARD_KEY",
  "UNKNOWN_FIELD",
  "UNKNOWN_FILTER",
  "UNFILTERABLE_FIELD",
  "UNSORTABLE_FIELD",
  "UNSUPPORTED_AGGREGATION",
  "UNSUPPORTED_DIMENSION_FIELD",
  "UNSUPPORTED_FILTER",
  "UNSUPPORTED_METRIC_FIELD",
  "UNSUPPORTED_TIME_FIELD",
  "UNSUPPORTED_TIME_SERIES",
  "UNTRUSTED_CARD_ID",
]);
export type DashboardProposalValidationIssueCode = z.infer<
  typeof DashboardProposalValidationIssueCodeSchema
>;

export const DashboardProposalValidationIssueSchema = z
  .object({
    code: DashboardProposalValidationIssueCodeSchema,
    message: z.string().min(1),
    path: z.array(z.union([z.string(), z.number()])),
    actionIndex: z.number().int().nonnegative().optional(),
  })
  .strict();
export type DashboardProposalValidationIssue = z.infer<
  typeof DashboardProposalValidationIssueSchema
>;

export const DashboardProposalValidationResultSchema = z
  .object({
    valid: z.boolean(),
    canApply: z.boolean(),
    errors: z.array(DashboardProposalValidationIssueSchema),
    warnings: z.array(DashboardProposalValidationIssueSchema),
  })
  .strict();
export type DashboardProposalValidationResult = z.infer<
  typeof DashboardProposalValidationResultSchema
>;

export const DashboardProposalPreviewCardSchema = z
  .object({
    id: z.string().min(1).optional(),
    cardKey: z.string().min(1).optional(),
    title: z.string().min(1),
    layout: ProposedCardSchema.shape.layout.extend({
      x: z.number().int().nonnegative(),
      y: z.number().int().nonnegative(),
    }),
    changes: z
      .array(
        z.enum([
          "unchanged",
          "added",
          "updated",
          "moved",
          "resized",
          "removed",
        ]),
      )
      .min(1),
  })
  .strict();
export type DashboardProposalPreviewCard = z.infer<
  typeof DashboardProposalPreviewCardSchema
>;

export const DashboardProposalPreviewSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    cards: z.array(DashboardProposalPreviewCardSchema),
  })
  .strict();
export type DashboardProposalPreview = z.infer<
  typeof DashboardProposalPreviewSchema
>;

export const CreateDashboardProposalRequestSchema = z
  .object({
    prompt: z.string().trim().min(1).max(10_000),
    dashboardId: z.string().min(1).optional(),
    revision: z.union([z.string(), z.number().int().positive()]).optional(),
    dataSourceId: z.string().min(1).optional(),
  })
  .strict();
export type CreateDashboardProposalRequest = z.infer<
  typeof CreateDashboardProposalRequestSchema
>;

export const CreateDashboardProposalResponseSchema = z
  .object({
    proposal: DashboardProposalSchema,
    validation: DashboardProposalValidationResultSchema,
    preview: DashboardProposalPreviewSchema,
    dashboardId: z.string().min(1).optional(),
    revision: z.string().min(1).optional(),
  })
  .strict();
export type CreateDashboardProposalResponse = z.infer<
  typeof CreateDashboardProposalResponseSchema
>;

export const ValidateDashboardProposalRequestSchema = z
  .object({
    proposal: DashboardProposalSchema,
    dashboardId: z.string().min(1).optional(),
    revision: z.union([z.string(), z.number().int().positive()]).optional(),
    dataSourceId: z.string().min(1).optional(),
  })
  .strict()
  .refine(
    (request) =>
      (request.dashboardId === undefined) === (request.revision === undefined),
    { message: "dashboardId and revision must be provided together" },
  );
export type ValidateDashboardProposalRequest = z.infer<
  typeof ValidateDashboardProposalRequestSchema
>;

export const ApplyDashboardProposalRequestSchema =
  ValidateDashboardProposalRequestSchema;
export type ApplyDashboardProposalRequest = z.infer<
  typeof ApplyDashboardProposalRequestSchema
>;

export function dashboardProposalJsonSchema() {
  return z.toJSONSchema(DashboardProposalSchema, {
    target: "draft-07",
    unrepresentable: "any",
  });
}
