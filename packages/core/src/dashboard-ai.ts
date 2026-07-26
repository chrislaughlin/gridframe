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
    card: ProposedCardSchema.omit({ id: true }),
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
    actions: z.array(DashboardActionSchema).max(32),
    assumptions: z.array(z.string()).max(20),
    missingInformation: z.array(z.string()).max(20),
    explanation: z.string().optional(),
  })
  .strict();
export type DashboardProposal = z.infer<typeof DashboardProposalSchema>;

export const DashboardProposalValidationIssueCodeSchema = z.enum([
  "CREATE_DASHBOARD_REQUIRED",
  "DASHBOARD_ALREADY_EXISTS",
  "DUPLICATE_CARD_KEY",
  "DUPLICATE_FILTER_ID",
  "EMPTY_DASHBOARD",
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
  return strictProviderSchema(baseDashboardProposalJsonSchema()) as Record<
    string,
    unknown
  >;
}

const providerScalarSchema = {
  anyOf: [
    { type: "string" },
    { type: "number" },
    { type: "boolean" },
    { type: "null" },
  ],
} as const;

const providerFilterValueSchema = {
  anyOf: [
    ...providerScalarSchema.anyOf,
    { type: "array", items: providerScalarSchema },
  ],
} as const;

function baseDashboardProposalJsonSchema() {
  return z.toJSONSchema(DashboardProposalSchema, {
    target: "draft-07",
    unrepresentable: "any",
  });
}

function strictProviderSchema(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(strictProviderSchema);
  }
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  if (isDiscriminatedProviderUnion(record.oneOf)) {
    return mergeDiscriminatedProviderUnion(record.oneOf);
  }
  if (Array.isArray(record.allOf) && record.allOf.length === 1) {
    return strictProviderSchema(record.allOf[0]);
  }
  if (
    typeof record.$ref === "string" &&
    record.$ref.startsWith("#/definitions/__schema")
  ) {
    return providerFilterValueSchema;
  }
  const transformed = Object.fromEntries(
    Object.entries(record)
      .filter(([key]) => key !== "definitions")
      .map(([key, entry]) => [key, strictProviderSchema(entry)]),
  );
  if (
    record.type !== "object" ||
    !record.properties ||
    typeof record.properties !== "object"
  ) {
    return transformed;
  }
  const originalRequired = new Set(
    Array.isArray(record.required) ? record.required : [],
  );
  const properties = transformed.properties as Record<string, unknown>;
  for (const [key, schema] of Object.entries(properties)) {
    if (!originalRequired.has(key)) {
      properties[key] = { anyOf: [schema, { type: "null" }] };
    }
  }
  transformed.required = Object.keys(properties);
  return transformed;
}

function isDiscriminatedProviderUnion(
  value: unknown,
): value is Record<string, unknown>[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((candidate) => {
      if (!candidate || typeof candidate !== "object") return false;
      const properties = (candidate as Record<string, unknown>).properties;
      if (!properties || typeof properties !== "object") return false;
      const type = (properties as Record<string, unknown>).type;
      return (
        type &&
        typeof type === "object" &&
        typeof (type as Record<string, unknown>).const === "string"
      );
    })
  );
}

function mergeDiscriminatedProviderUnion(variants: Record<string, unknown>[]) {
  const mergedProperties: Record<string, unknown> = {};
  const types: string[] = [];
  for (const variant of variants) {
    const transformed = strictProviderSchema(variant) as {
      properties: Record<string, unknown>;
    };
    const sourceType = (
      (variant.properties as Record<string, unknown>).type as Record<
        string,
        unknown
      >
    ).const as string;
    types.push(sourceType);
    for (const [key, property] of Object.entries(transformed.properties)) {
      if (key !== "type" && !(key in mergedProperties)) {
        mergedProperties[key] = {
          anyOf: [property, { type: "null" }],
        };
      }
    }
  }
  const properties = {
    type: { type: "string", enum: types },
    ...mergedProperties,
  };
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

export function normalizeDashboardProposalProviderOutput(input: unknown) {
  return restoreCreateDashboardMetadata(
    normalizeProviderCards(
      stripOptionalProviderNulls(input, baseDashboardProposalJsonSchema()),
    ),
  );
}

function normalizeProviderCards(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const proposal = value as Record<string, unknown>;
  if (!Array.isArray(proposal.actions)) return value;

  return {
    ...proposal,
    actions: proposal.actions.map((action) => {
      if (!action || typeof action !== "object" || Array.isArray(action)) {
        return action;
      }
      const actionRecord = action as Record<string, unknown>;
      const card = actionRecord.card;
      if (!card || typeof card !== "object" || Array.isArray(card)) {
        return action;
      }
      const cardRecord = card as Record<string, unknown>;
      const data = normalizeProviderCardSort(cardRecord.data);
      const layout = cardRecord.layout;
      return {
        ...actionRecord,
        card: {
          ...cardRecord,
          ...(data === cardRecord.data ? {} : { data }),
          ...(actionRecord.type === "addCard" &&
          layout &&
          typeof layout === "object" &&
          !Array.isArray(layout)
            ? {
                layout: Object.fromEntries(
                  Object.entries(layout).filter(
                    ([key]) => key !== "x" && key !== "y",
                  ),
                ),
              }
            : {}),
        },
      };
    }),
  };
}

function normalizeProviderCardSort(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.metrics) || !Array.isArray(data.sort)) return value;
  const aliases = new Map(
    data.metrics.flatMap((metric) => {
      if (!metric || typeof metric !== "object" || Array.isArray(metric)) {
        return [];
      }
      const { alias, field } = metric as Record<string, unknown>;
      return typeof alias === "string" && typeof field === "string"
        ? [[alias, field] as const]
        : [];
    }),
  );
  if (aliases.size === 0) return value;
  return {
    ...data,
    sort: data.sort.map((sort) => {
      if (!sort || typeof sort !== "object" || Array.isArray(sort)) return sort;
      const sortRecord = sort as Record<string, unknown>;
      const field =
        typeof sortRecord.field === "string"
          ? aliases.get(sortRecord.field)
          : undefined;
      return field ? { ...sortRecord, field } : sort;
    }),
  };
}

function restoreCreateDashboardMetadata(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const proposal = value as Record<string, unknown>;
  if (typeof proposal.title !== "string" || !Array.isArray(proposal.actions)) {
    return value;
  }
  return {
    ...proposal,
    actions: proposal.actions.map((action) => {
      if (
        !action ||
        typeof action !== "object" ||
        Array.isArray(action) ||
        (action as Record<string, unknown>).type !== "createDashboard"
      ) {
        return action;
      }
      const create = action as Record<string, unknown>;
      return {
        ...create,
        title:
          typeof create.title === "string" ? create.title : proposal.title,
        ...(typeof create.description === "string"
          ? {}
          : typeof proposal.description === "string"
            ? { description: proposal.description }
            : {}),
      };
    }),
  };
}

function stripOptionalProviderNulls(value: unknown, schema: unknown): unknown {
  if (!schema || typeof schema !== "object") return value;
  const record = schema as Record<string, unknown>;
  if (Array.isArray(value)) {
    return value.map((item) => stripOptionalProviderNulls(item, record.items));
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const source = value as Record<string, unknown>;
  const selected = selectProviderObjectSchema(source, record);
  const properties =
    selected.properties && typeof selected.properties === "object"
      ? (selected.properties as Record<string, unknown>)
      : {};
  const hasDeclaredProperties =
    selected.properties !== undefined &&
    typeof selected.properties === "object";
  const required = new Set(
    Array.isArray(selected.required) ? selected.required : [],
  );
  return Object.fromEntries(
    Object.entries(source).flatMap(([key, entry]) => {
      if (hasDeclaredProperties && !(key in properties)) return [];
      if (entry === null && !required.has(key)) return [];
      return [
        [key, stripOptionalProviderNulls(entry, properties[key])] as const,
      ];
    }),
  );
}

function selectProviderObjectSchema(
  value: Record<string, unknown>,
  schema: Record<string, unknown>,
) {
  if (!Array.isArray(schema.oneOf)) return schema;
  return (schema.oneOf.find((candidate) => {
    if (!candidate || typeof candidate !== "object") return false;
    const properties = (candidate as Record<string, unknown>).properties;
    if (!properties || typeof properties !== "object") return false;
    const type = (properties as Record<string, unknown>).type;
    return (
      type &&
      typeof type === "object" &&
      (type as Record<string, unknown>).const === value.type
    );
  }) ?? schema) as Record<string, unknown>;
}
