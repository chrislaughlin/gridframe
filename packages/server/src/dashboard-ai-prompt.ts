import type {
  AICardDefinition,
  AIDataField,
  DashboardProposalValidationIssue,
  DashboardCardDataConfig,
} from "@gridframe/core";

import type { PersistedDashboard } from "./index";

const DASHBOARD_AI_SYSTEM_PROMPT = `You plan Gridframe Dashboards using only the supplied capabilities.
Return only one JSON object matching the supplied schema. Do not wrap it in prose or Markdown.
Use only cardKey values from aiCardLibrary and fields from dataCatalogue. Never invent or substitute data.
Never write SQL, GraphQL, JavaScript, React, code, or unrestricted queries.
Prefer a small useful Dashboard. Put KPI Cards before supporting Visualizations. Use line/area for time series, bar for categorical comparisons, tables for records, and pie only for a few meaningful parts of a whole.
Record assumptions. Put unresolved blockers in missingInformation.
For a requested user-selectable global filter, omit value instead of inventing one.
When editing, preserve every existing Card unless the user explicitly asks to remove or replace it.
When mode is create, use createDashboard exactly once. When mode is edit, use updateDashboardMetadata instead.
Use explicit actions and keep every Card inside the four-column non-overlapping grid.`;

function buildDashboardProposalPrompt(input: {
  prompt: string;
  aiCardLibrary: readonly AICardDefinition[];
  dataCatalogue: readonly AIDataField[];
  dashboard?: PersistedDashboard;
  dataSourceId?: string;
}) {
  const safeFields = new Set(input.dataCatalogue.map((field) => field.key));
  return JSON.stringify({
    request: input.prompt,
    dataSourceId: input.dataSourceId,
    aiCardLibrary: input.aiCardLibrary,
    dataCatalogue: input.dataCatalogue,
    mode: input.dashboard ? "edit" : "create",
    currentDashboard: input.dashboard
      ? {
          id: input.dashboard.id,
          revision: String(input.dashboard.revision),
          title: input.dashboard.title,
          description: input.dashboard.description,
          globalFilters: (input.dashboard.globalFilters ?? []).filter(
            (filter) => safeFields.has(filter.field),
          ),
          cards: input.dashboard.cards.map((card) => ({
            id: card.id,
            cardKey: card.libraryItemKey,
            title: card.name,
            description: card.description,
            visualization: card.visualization,
            data: safeCardData(card.data, safeFields),
            layout: card.layout,
          })),
        }
      : undefined,
  });
}

function safeCardData(
  data: DashboardCardDataConfig | undefined,
  safeFields: ReadonlySet<string>,
) {
  if (!data) return undefined;
  return {
    metrics: data.metrics?.filter((metric) => safeFields.has(metric.field)),
    dimensions: data.dimensions?.filter((field) => safeFields.has(field)),
    filters: data.filters?.filter((filter) => safeFields.has(filter.field)),
    time: data.time && safeFields.has(data.time.field) ? data.time : undefined,
    sort: data.sort?.filter((sort) => safeFields.has(sort.field)),
    limit: data.limit,
  };
}

function buildDashboardProposalRepairPrompt(input: {
  originalPrompt: string;
  invalidResponse: string;
  errors: readonly DashboardProposalValidationIssue[];
}) {
  return JSON.stringify({
    request: "Correct the invalid Dashboard proposal and return only JSON.",
    originalContext: JSON.parse(input.originalPrompt) as unknown,
    invalidResponse: input.invalidResponse,
    validationErrors: input.errors,
  });
}

export {
  DASHBOARD_AI_SYSTEM_PROMPT,
  buildDashboardProposalPrompt,
  buildDashboardProposalRepairPrompt,
};
