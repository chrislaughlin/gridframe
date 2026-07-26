import {
  DashboardProposalSchema,
  validateDashboardLayout,
  type AICardDefinition,
  type AIDataField,
  type DashboardCardDataConfig,
  type DashboardCardLayout,
  type DashboardProposal,
  type DashboardProposalPreviewCard,
  type DashboardProposalValidationIssue,
  type DashboardProposalValidationIssueCode,
} from "@gridframe/core";

import { findFirstAvailableDashboardLayout } from "./dashboard-layout";
import type {
  DashboardAIContext,
  DashboardProposalApplyCard,
  DashboardProposalApplyUpdate,
  DashboardProposalPlan,
} from "./dashboard-ai-types";

type WorkingCard = DashboardProposalApplyCard & { id: string };

function validateDashboardProposal(
  input: unknown,
  context: DashboardAIContext,
): DashboardProposalPlan {
  const parsed = DashboardProposalSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (issue): DashboardProposalValidationIssue => ({
        code: "INVALID_PROPOSAL",
        message: issue.message,
        path: issue.path.map((part) =>
          typeof part === "symbol" ? (part.description ?? "symbol") : part,
        ),
      }),
    );
    return {
      proposal: emptyProposal(),
      validation: { valid: false, canApply: false, errors, warnings: [] },
      preview: { title: "Invalid proposal", cards: [] },
    };
  }

  return planProposal(parsed.data, context);
}

function planProposal(
  proposal: DashboardProposal,
  context: DashboardAIContext,
): DashboardProposalPlan {
  const errors: DashboardProposalValidationIssue[] = [];
  const warnings: DashboardProposalValidationIssue[] =
    proposal.missingInformation.map((message, index) => ({
      code: "MISSING_INFORMATION",
      message,
      path: ["missingInformation", index],
    }));
  const currentDashboard = context.dashboard;
  let title = currentDashboard?.title ?? proposal.title;
  let description = currentDashboard?.description;
  let cards: WorkingCard[] = (currentDashboard?.cards ?? []).map((card) => ({
    id: card.id,
    libraryItemKey: card.libraryItemKey,
    name: card.name,
    description: card.description,
    visualization: card.visualization,
    data: card.data,
    sourceQuery: card.sourceQuery,
    deeplink: card.deeplink,
    layout: card.layout,
  }));
  let globalFilters = [...(currentDashboard?.globalFilters ?? [])];
  const cardChanges = new Map<
    string,
    Set<DashboardProposalPreviewCard["changes"][number]>
  >();
  const removedCards: DashboardProposalPreviewCard[] = [];
  const createActions = proposal.actions.filter(
    (action) => action.type === "createDashboard",
  );

  if (!currentDashboard && createActions.length !== 1) {
    addError(
      errors,
      "CREATE_DASHBOARD_REQUIRED",
      "A new Dashboard proposal must contain exactly one createDashboard action",
      undefined,
      ["actions"],
    );
  }
  if (currentDashboard && createActions.length > 0) {
    addError(
      errors,
      "DASHBOARD_ALREADY_EXISTS",
      "Use updateDashboardMetadata when editing an existing Dashboard",
      undefined,
      ["actions"],
    );
  }

  proposal.actions.forEach((action, actionIndex) => {
    switch (action.type) {
      case "createDashboard":
        if (!currentDashboard) {
          title = action.title;
          description = action.description;
        }
        break;
      case "updateDashboardMetadata":
        title = action.title ?? title;
        description = action.description ?? description;
        break;
      case "addCard": {
        const card = proposedCard(
          action.card,
          `proposal-card-${actionIndex}`,
          cards,
          context,
          errors,
          actionIndex,
        );
        if (card) {
          cards = [...cards, card];
          markCardChange(cardChanges, card.id, "added");
        }
        break;
      }
      case "updateCard": {
        const index = cards.findIndex((card) => card.id === action.cardId);
        if (index < 0) {
          addUnknownCardId(errors, action.cardId, actionIndex);
          break;
        }
        const withoutCurrent = cards.filter(
          (_, cardIndex) => cardIndex !== index,
        );
        const card = proposedCard(
          action.card,
          action.cardId,
          withoutCurrent,
          context,
          errors,
          actionIndex,
        );
        if (card) {
          cards = cards.map((current, cardIndex) =>
            cardIndex === index ? card : current,
          );
          markCardChange(cardChanges, action.cardId, "updated");
        }
        break;
      }
      case "removeCard": {
        const removed = cards.find((card) => card.id === action.cardId);
        if (!removed) {
          addUnknownCardId(errors, action.cardId, actionIndex);
          break;
        }
        removedCards.push(previewCard(removed, ["removed"]));
        cardChanges.delete(action.cardId);
        cards = cards.filter((card) => card.id !== action.cardId);
        break;
      }
      case "moveCard":
        cards = updateCardLayout(
          cards,
          action.cardId,
          actionIndex,
          errors,
          (layout) => ({ ...layout, x: action.x, y: action.y }),
        );
        if (cards.some((card) => card.id === action.cardId)) {
          markCardChange(cardChanges, action.cardId, "moved");
        }
        break;
      case "resizeCard":
        cards = updateCardLayout(
          cards,
          action.cardId,
          actionIndex,
          errors,
          (layout) => ({
            ...layout,
            width: action.width,
            height: action.height,
          }),
        );
        if (cards.some((card) => card.id === action.cardId)) {
          markCardChange(cardChanges, action.cardId, "resized");
        }
        break;
      case "addGlobalFilter": {
        validateFilter(
          action.filter,
          context.dataCatalogue,
          errors,
          actionIndex,
          ["filter"],
        );
        const id = action.filter.id ?? `proposal-filter-${actionIndex}`;
        if (globalFilters.some((filter) => filter.id === id)) {
          addError(
            errors,
            "DUPLICATE_FILTER_ID",
            `Global filter ${id} already exists`,
            actionIndex,
            ["filter", "id"],
          );
          break;
        }
        globalFilters = [...globalFilters, { ...action.filter, id }];
        break;
      }
      case "removeGlobalFilter":
        if (!globalFilters.some((filter) => filter.id === action.filterId)) {
          addError(
            errors,
            "UNKNOWN_FILTER",
            `Global filter ${action.filterId} is not on the Dashboard`,
            actionIndex,
            ["filterId"],
          );
          break;
        }
        globalFilters = globalFilters.filter(
          (filter) => filter.id !== action.filterId,
        );
        break;
    }
  });

  const duplicateKeys = duplicateValues(
    cards.flatMap((card) => (card.libraryItemKey ? [card.libraryItemKey] : [])),
  );
  for (const key of duplicateKeys) {
    addError(
      errors,
      "DUPLICATE_CARD_KEY",
      `Card ${key} can only be added once`,
      undefined,
      ["actions"],
    );
  }

  if (!currentDashboard && cards.length === 0) {
    addError(
      errors,
      "EMPTY_DASHBOARD",
      "A new Dashboard proposal must add at least one Card",
      undefined,
      ["actions"],
    );
  }

  const layout = validateDashboardLayout(
    cards.map((card) => ({ id: card.id, ...card.layout })),
    cards.map((card) => card.id),
  );
  if (!layout.valid) {
    for (const message of layout.errors) {
      addError(errors, "INVALID_LAYOUT", message, undefined, ["actions"]);
    }
  }

  const validation = {
    valid: errors.length === 0,
    canApply: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
  };
  const update: DashboardProposalApplyUpdate = {
    title,
    description,
    globalFilters,
    cards: cards.map(({ id, ...card }) => ({
      ...card,
      id: id.startsWith("proposal-card-") ? undefined : id,
    })),
  };

  return {
    proposal,
    validation,
    preview: {
      title,
      description,
      cards: [
        ...cards.map((card) =>
          previewCard(card, [
            ...(cardChanges.get(card.id) ?? new Set(["unchanged" as const])),
          ]),
        ),
        ...removedCards,
      ],
    },
    update: validation.valid ? update : undefined,
  };
}

function proposedCard(
  proposal: {
    cardKey: string;
    title: string;
    description?: string;
    data: DashboardCardDataConfig;
    layout: { x?: number; y?: number; width: number; height: number };
  },
  id: string,
  otherCards: WorkingCard[],
  context: DashboardAIContext,
  errors: DashboardProposalValidationIssue[],
  actionIndex: number,
): WorkingCard | undefined {
  const cardDefinition = context.aiCardLibrary.find(
    (card) => card.key === proposal.cardKey,
  );
  const libraryItem = context.cardLibrary.find(
    (card) => card.key === proposal.cardKey,
  );
  if (!cardDefinition || !libraryItem) {
    addError(
      errors,
      "UNKNOWN_CARD_KEY",
      `Card ${proposal.cardKey} is not in the approved AI Card library`,
      actionIndex,
      ["card", "cardKey"],
    );
    return undefined;
  }

  validateCardData(
    proposal.data,
    cardDefinition,
    context.dataCatalogue,
    errors,
    actionIndex,
  );

  const requestedLayout = {
    width: proposal.layout.width,
    height: proposal.layout.height,
  };
  const layout =
    proposal.layout.x === undefined || proposal.layout.y === undefined
      ? firstAvailableLayout(otherCards, requestedLayout)
      : {
          x: proposal.layout.x,
          y: proposal.layout.y,
          ...requestedLayout,
        };

  return {
    id,
    libraryItemKey: proposal.cardKey,
    name: proposal.title,
    description: proposal.description,
    visualization: libraryItem.visualization,
    data: proposal.data,
    layout,
  };
}

function validateCardData(
  data: DashboardCardDataConfig,
  card: AICardDefinition,
  fields: readonly AIDataField[],
  errors: DashboardProposalValidationIssue[],
  actionIndex: number,
) {
  const metrics = data.metrics ?? [];
  const dimensions = data.dimensions ?? [];
  validateCount(
    metrics.length,
    card.requiredDataShape.minMetrics,
    card.requiredDataShape.maxMetrics,
    "metric",
    errors,
    actionIndex,
  );
  validateCount(
    dimensions.length,
    card.requiredDataShape.minDimensions,
    card.requiredDataShape.maxDimensions,
    "dimension",
    errors,
    actionIndex,
  );

  metrics.forEach((metric, index) => {
    const field = requireField(metric.field, fields, errors, actionIndex, [
      "card",
      "data",
      "metrics",
      index,
      "field",
    ]);
    if (
      field &&
      metric.aggregation &&
      !field.allowedAggregations?.includes(metric.aggregation)
    ) {
      addError(
        errors,
        "UNSUPPORTED_AGGREGATION",
        `${metric.aggregation} is not allowed for ${metric.field}`,
        actionIndex,
        ["card", "data", "metrics", index, "aggregation"],
      );
    }
    if (
      field &&
      field.role !== "metric" &&
      !(field.allowedAggregations?.length && metric.aggregation)
    ) {
      addError(
        errors,
        "UNSUPPORTED_METRIC_FIELD",
        `${field.key} cannot be used as a metric`,
        actionIndex,
        ["card", "data", "metrics", index, "field"],
      );
    }
  });
  dimensions.forEach((key, index) => {
    const field = requireField(key, fields, errors, actionIndex, [
      "card",
      "data",
      "dimensions",
      index,
    ]);
    if (field && field.role !== "dimension") {
      addError(
        errors,
        "UNSUPPORTED_DIMENSION_FIELD",
        `${field.key} cannot be used as a dimension`,
        actionIndex,
        ["card", "data", "dimensions", index],
      );
    }
  });
  data.filters?.forEach((filter, index) =>
    validateFilter(
      filter,
      fields,
      errors,
      actionIndex,
      ["card", "data", "filters", index],
      card,
    ),
  );
  if (data.time) {
    const field = requireField(data.time.field, fields, errors, actionIndex, [
      "card",
      "data",
      "time",
      "field",
    ]);
    if (
      field &&
      field.role !== "time" &&
      field.type !== "date" &&
      field.type !== "datetime"
    ) {
      addError(
        errors,
        "UNSUPPORTED_TIME_FIELD",
        `${field.key} is not a time field`,
        actionIndex,
        ["card", "data", "time", "field"],
      );
    }
    if (card.requiredDataShape.supportsTimeSeries === false) {
      addError(
        errors,
        "UNSUPPORTED_TIME_SERIES",
        `Card ${card.key} does not support time-series data`,
        actionIndex,
        ["card", "data", "time"],
      );
    }
  }
  data.sort?.forEach((sort, index) => {
    const field = requireField(sort.field, fields, errors, actionIndex, [
      "card",
      "data",
      "sort",
      index,
      "field",
    ]);
    if (field && !field.sortable) {
      addError(
        errors,
        "UNSORTABLE_FIELD",
        `${field.key} is not sortable`,
        actionIndex,
        ["card", "data", "sort", index, "field"],
      );
    }
  });
}

function validateFilter(
  filter: { field: string; operator: string },
  fields: readonly AIDataField[],
  errors: DashboardProposalValidationIssue[],
  actionIndex: number,
  path: Array<string | number>,
  card?: AICardDefinition,
) {
  const field = requireField(filter.field, fields, errors, actionIndex, [
    ...path,
    "field",
  ]);
  if (field && !field.filterable) {
    addError(
      errors,
      "UNFILTERABLE_FIELD",
      `${field.key} is not filterable`,
      actionIndex,
      [...path, "field"],
    );
  }
  if (
    card?.supportedFilters &&
    !card.supportedFilters.includes(filter.operator as never)
  ) {
    addError(
      errors,
      "UNSUPPORTED_FILTER",
      `${filter.operator} is not supported by Card ${card.key}`,
      actionIndex,
      [...path, "operator"],
    );
  }
}

function requireField(
  key: string,
  fields: readonly AIDataField[],
  errors: DashboardProposalValidationIssue[],
  actionIndex: number,
  path: Array<string | number>,
) {
  const field = fields.find((candidate) => candidate.key === key);
  if (!field) {
    addError(
      errors,
      "UNKNOWN_FIELD",
      `Field ${key} is not in the approved data catalogue`,
      actionIndex,
      path,
    );
  }
  return field;
}

function validateCount(
  count: number,
  minimum: number | undefined,
  maximum: number | undefined,
  kind: string,
  errors: DashboardProposalValidationIssue[],
  actionIndex: number,
) {
  if (minimum !== undefined && count < minimum) {
    addError(
      errors,
      "INVALID_DATA_SHAPE",
      `Card requires at least ${minimum} ${kind}${minimum === 1 ? "" : "s"}`,
      actionIndex,
      ["card", "data"],
    );
  }
  if (maximum !== undefined && count > maximum) {
    addError(
      errors,
      "INVALID_DATA_SHAPE",
      `Card supports at most ${maximum} ${kind}${maximum === 1 ? "" : "s"}`,
      actionIndex,
      ["card", "data"],
    );
  }
}

function updateCardLayout(
  cards: WorkingCard[],
  cardId: string,
  actionIndex: number,
  errors: DashboardProposalValidationIssue[],
  update: (layout: DashboardCardLayout) => DashboardCardLayout,
) {
  if (!cards.some((card) => card.id === cardId)) {
    addUnknownCardId(errors, cardId, actionIndex);
    return cards;
  }
  return cards.map((card) =>
    card.id === cardId ? { ...card, layout: update(card.layout) } : card,
  );
}

function firstAvailableLayout(
  cards: readonly WorkingCard[],
  size: { width: number; height: number },
): DashboardCardLayout {
  return (
    findFirstAvailableDashboardLayout(cards, size) ?? { x: 0, y: 0, ...size }
  );
}

function duplicateValues(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return duplicates;
}

function addUnknownCardId(
  errors: DashboardProposalValidationIssue[],
  cardId: string,
  actionIndex: number,
) {
  addError(
    errors,
    "UNKNOWN_CARD_ID",
    `Card ${cardId} is not on the Dashboard`,
    actionIndex,
    ["cardId"],
  );
}

function addError(
  errors: DashboardProposalValidationIssue[],
  code: DashboardProposalValidationIssueCode,
  message: string,
  actionIndex: number | undefined,
  path: Array<string | number>,
) {
  errors.push({
    code,
    message,
    path: actionIndex === undefined ? path : ["actions", actionIndex, ...path],
    actionIndex,
  });
}

function markCardChange(
  changes: Map<string, Set<DashboardProposalPreviewCard["changes"][number]>>,
  cardId: string,
  change: DashboardProposalPreviewCard["changes"][number],
) {
  const current = changes.get(cardId) ?? new Set();
  current.add(change);
  changes.set(cardId, current);
}

function previewCard(
  card: WorkingCard,
  changes: DashboardProposalPreviewCard["changes"],
): DashboardProposalPreviewCard {
  return {
    id: card.id.startsWith("proposal-card-") ? undefined : card.id,
    cardKey: card.libraryItemKey,
    title: card.name,
    layout: card.layout,
    changes,
  };
}

function emptyProposal(): DashboardProposal {
  return {
    version: 1,
    title: "Invalid proposal",
    intent: { objective: "Invalid proposal" },
    actions: [],
    assumptions: [],
    missingInformation: [],
  };
}

export { validateDashboardProposal };
