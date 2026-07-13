import { type DashboardApiError } from "@gridframe/core";
import {
  adaptSourceRecords,
  getCardDefinition,
  normalizeSourceTable,
  type SourceRecord,
} from "./card-definitions";
import { type PersistedDashboardCardWithQuery } from "./repository";

type CardDataIdentity = {
  userId: string;
  dashboardId: string;
  cardId: string;
};

type FetchSource = (input: string, init: RequestInit) => Promise<Response>;

function createCardDataHandler(
  repository: {
    findOwnedCard: (
      userId: string,
      dashboardId: string,
      cardId: string,
    ) =>
      | PersistedDashboardCardWithQuery
      | undefined
      | Promise<PersistedDashboardCardWithQuery | undefined>;
  },
  fetchSource: FetchSource = fetch,
  consumerApiBaseUrl = "http://localhost:3000/api/consumer/",
) {
  return async function fetchCardData(
    request: Request,
    identity: CardDataIdentity,
  ): Promise<Response> {
    if (
      !isIdentitySegment(identity.userId) ||
      !isIdentitySegment(identity.dashboardId) ||
      !isIdentitySegment(identity.cardId)
    ) {
      return errorResponse(400, "INVALID_REQUEST", "Invalid Card data request");
    }

    const card = await repository.findOwnedCard(
      identity.userId,
      identity.dashboardId,
      identity.cardId,
    );

    if (!card) {
      return errorResponse(
        404,
        "DASHBOARD_CARD_NOT_FOUND",
        "Dashboard Card not found",
      );
    }

    const definition = getCardDefinition(card.libraryItemKey);
    if (!definition || definition.visualization !== card.visualization) {
      return cardQueryFailed();
    }

    const sourceUrl = resolveSourceUrl(card.sourceQuery, consumerApiBaseUrl);
    if (!sourceUrl) {
      return cardQueryFailed();
    }

    try {
      const signal = AbortSignal.any([
        request.signal,
        AbortSignal.timeout(3_000),
      ]);
      const response = await fetchSource(sourceUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
      });

      if (!response.ok) {
        return cardQueryFailed();
      }

      const body = await response.json();
      const records = readRecords(body);
      if (!records) {
        return cardQueryFailed();
      }

      const adapted = adaptSourceRecords(definition, records);
      if (
        new URL(request.url).searchParams.get("includeSource") === "true" &&
        adapted.status === "success"
      ) {
        return Response.json({
          ...adapted,
          sourceData: normalizeSourceTable(records),
        });
      }
      return Response.json(adapted);
    } catch {
      return cardQueryFailed();
    }
  };
}

function resolveSourceUrl(sourceQuery: string, consumerApiBaseUrl: string) {
  if (
    !sourceQuery.startsWith("/api/consumer/") ||
    sourceQuery.startsWith("//") ||
    sourceQuery.includes("#")
  ) {
    return undefined;
  }

  try {
    const decodedSegments = sourceQuery
      .split("/")
      .map((segment) => decodeURIComponent(segment));
    if (decodedSegments.includes("..")) {
      return undefined;
    }

    const consumerBase = new URL(consumerApiBaseUrl);
    const source = new URL(sourceQuery, consumerBase.origin);
    if (
      source.origin !== consumerBase.origin ||
      !source.pathname.startsWith(consumerBase.pathname)
    ) {
      return undefined;
    }

    return source.toString();
  } catch {
    return undefined;
  }
}

function readRecords(value: unknown): SourceRecord[] | undefined {
  if (!value || typeof value !== "object" || !("records" in value)) {
    return undefined;
  }

  const records = value.records;
  if (!Array.isArray(records) || records.some((record) => !isRecord(record))) {
    return undefined;
  }

  return records;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIdentitySegment(value: string) {
  return value.trim().length > 0 && value.length <= 256;
}

function cardQueryFailed() {
  return errorResponse(
    502,
    "CARD_QUERY_FAILED",
    "Card data could not be loaded",
  );
}

function errorResponse(
  status: number,
  code: DashboardApiError["error"]["code"],
  message: string,
) {
  return Response.json(
    { error: { code, message } } satisfies DashboardApiError,
    { status },
  );
}

export { createCardDataHandler };
export type { CardDataIdentity, FetchSource };
