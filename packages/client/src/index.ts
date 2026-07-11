import {
  CardLibraryResponseSchema,
  DashboardApiErrorSchema,
  DashboardBootstrapResponseSchema,
  DashboardCardMutationResponseSchema,
  DashboardDocumentSchema,
  PanelCardDataResponseSchema,
  PanelCardDataWithSourceResponseSchema,
  type AddDashboardCardRequest,
  type CardLibraryResponse,
  type DashboardApiErrorCode,
  type DashboardBootstrapResponse,
  type DashboardCardMutationResponse,
  type DashboardDocument,
  type PanelCardDataResponse,
  type PanelCardDataWithSourceResponse,
  type RemoveDashboardCardRequest,
  type UpdateDashboardCardRequest,
  type UpdateDashboardLayoutRequest,
} from "@gridframe/core";

const DEFAULT_API_BASE_URL = "/api/gridframe";

type RequestOptions = {
  apiBaseUrl?: string;
  signal?: AbortSignal;
};

type DashboardIdentity = RequestOptions & {
  userId: string;
  dashboardId: string;
};

type CardIdentity = DashboardIdentity & {
  cardId: string;
};

type RuntimeSchema<T> = {
  parse(value: unknown): T;
};

class DashboardClientError extends Error {
  readonly status: number;
  readonly code?: DashboardApiErrorCode | "INVALID_RESPONSE";

  constructor({
    status,
    message,
    code,
  }: {
    status: number;
    message: string;
    code?: DashboardApiErrorCode | "INVALID_RESPONSE";
  }) {
    super(message);
    this.name = "DashboardClientError";
    this.status = status;
    this.code = code;
  }
}

async function bootstrapDashboard(
  options: RequestOptions & { userId: string; dashboardId?: string },
): Promise<DashboardBootstrapResponse> {
  return requestJson({
    url: `${userDashboardsUrl(options)}/bootstrap`,
    init: jsonRequest("POST", { dashboardId: options.dashboardId }, options),
    schema: DashboardBootstrapResponseSchema,
  });
}

function fetchDashboardCardData(
  options: CardIdentity & { includeSource: true },
): Promise<PanelCardDataWithSourceResponse>;
function fetchDashboardCardData(
  options: CardIdentity & { includeSource?: false },
): Promise<PanelCardDataResponse>;
async function fetchDashboardCardData(
  options: CardIdentity & { includeSource?: boolean },
): Promise<PanelCardDataResponse> {
  const query = options.includeSource ? "?includeSource=true" : "";

  return requestJson({
    url: `${dashboardCardUrl(options)}/data${query}`,
    init: {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: options.signal,
    },
    schema: options.includeSource
      ? PanelCardDataWithSourceResponseSchema
      : PanelCardDataResponseSchema,
  });
}

async function updateDashboardLayout(
  options: DashboardIdentity & UpdateDashboardLayoutRequest,
): Promise<DashboardDocument> {
  return requestJson({
    url: `${dashboardUrl(options)}/layout`,
    init: jsonRequest(
      "PATCH",
      { revision: options.revision, cards: options.cards },
      options,
    ),
    schema: DashboardDocumentSchema,
  });
}

async function updateDashboardCard(
  options: CardIdentity & UpdateDashboardCardRequest,
): Promise<DashboardDocument> {
  return requestJson({
    url: dashboardCardUrl(options),
    init: jsonRequest(
      "PATCH",
      { revision: options.revision, name: options.name },
      options,
    ),
    schema: DashboardDocumentSchema,
  });
}

async function listCardLibrary(
  options: DashboardIdentity,
): Promise<CardLibraryResponse> {
  return requestJson({
    url: `${dashboardUrl(options)}/card-library`,
    init: {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: options.signal,
    },
    schema: CardLibraryResponseSchema,
  });
}

async function addDashboardCard(
  options: DashboardIdentity & AddDashboardCardRequest,
): Promise<DashboardCardMutationResponse> {
  return requestJson({
    url: `${dashboardUrl(options)}/cards`,
    init: jsonRequest(
      "POST",
      {
        revision: options.revision,
        libraryItemKey: options.libraryItemKey,
      },
      options,
    ),
    schema: DashboardCardMutationResponseSchema,
  });
}

async function removeDashboardCard(
  options: CardIdentity & RemoveDashboardCardRequest,
): Promise<DashboardCardMutationResponse> {
  return requestJson({
    url: dashboardCardUrl(options),
    init: jsonRequest("DELETE", { revision: options.revision }, options),
    schema: DashboardCardMutationResponseSchema,
  });
}

function jsonRequest(
  method: "POST" | "PATCH" | "DELETE",
  body: unknown,
  options: RequestOptions,
): RequestInit {
  return {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: options.signal,
  };
}

async function requestJson<T>({
  url,
  init,
  schema,
}: {
  url: string;
  init: RequestInit;
  schema: RuntimeSchema<T>;
}): Promise<T> {
  const response = await fetch(url, init);
  const body = await readJson(response);

  if (!response.ok) {
    const parsedError = DashboardApiErrorSchema.safeParse(body);

    throw new DashboardClientError({
      status: response.status,
      code: parsedError.success ? parsedError.data.error.code : undefined,
      message: parsedError.success
        ? parsedError.data.error.message
        : `Dashboard API request failed with ${response.status} ${response.statusText}`,
    });
  }

  try {
    return schema.parse(body);
  } catch {
    throw new DashboardClientError({
      status: response.status,
      code: "INVALID_RESPONSE",
      message: "Dashboard API returned an invalid response",
    });
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function dashboardCardUrl(options: CardIdentity) {
  return `${dashboardUrl(options)}/cards/${encodeURIComponent(options.cardId)}`;
}

function dashboardUrl(options: DashboardIdentity) {
  return `${userDashboardsUrl(options)}/${encodeURIComponent(options.dashboardId)}`;
}

function userDashboardsUrl(options: RequestOptions & { userId: string }) {
  return `${apiBaseUrl(options.apiBaseUrl)}/users/${encodeURIComponent(options.userId)}/dashboards`;
}

function apiBaseUrl(value = DEFAULT_API_BASE_URL) {
  return value.replace(/\/+$/, "");
}

export {
  DashboardClientError,
  addDashboardCard,
  bootstrapDashboard,
  fetchDashboardCardData,
  listCardLibrary,
  removeDashboardCard,
  updateDashboardCard,
  updateDashboardLayout,
};
export type { CardIdentity, DashboardIdentity, RequestOptions };
