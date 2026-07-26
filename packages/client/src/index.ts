import {
  CardLibraryResponseSchema,
  ApplyDashboardProposalResponseSchema,
  CreateDashboardProposalResponseSchema,
  DashboardApiErrorSchema,
  DashboardBootstrapResponseSchema,
  DashboardCardMutationResponseSchema,
  DashboardDocumentSchema,
  DashboardProposalValidationResultSchema,
  PanelCardDataResponseSchema,
  PanelCardDataWithSourceResponseSchema,
  type AddDashboardCardRequest,
  type ApplyDashboardProposalRequest,
  type ApplyDashboardProposalResponse,
  type CardLibraryResponse,
  type CreateDashboardProposalRequest,
  type CreateDashboardProposalResponse,
  type DashboardApiErrorCode,
  type DashboardBootstrapResponse,
  type DashboardCardMutationResponse,
  type DashboardDocument,
  type DashboardProposalValidationResult,
  type PanelCardDataResponse,
  type PanelCardDataWithSourceResponse,
  type RemoveDashboardCardRequest,
  type UpdateDashboardCardRequest,
  type UpdateDashboardGlobalFilterRequest,
  type UpdateDashboardLayoutRequest,
  type ValidateDashboardProposalRequest,
} from "@gridframe/core";

const DEFAULT_API_BASE_URL = "/api/gridframe";

type RequestOptions = {
  apiBaseUrl?: string;
  signal?: AbortSignal;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  fetch?: typeof globalThis.fetch;
};

type DashboardIdentity = RequestOptions & {
  userId: string;
  dashboardId: string;
};

type DashboardAIIdentity = RequestOptions & {
  userId: string;
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
    fetcher: options.fetch,
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
      headers: mergeHeaders(options.headers, { Accept: "application/json" }),
      credentials: options.credentials,
      signal: options.signal,
    },
    fetcher: options.fetch,
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
    fetcher: options.fetch,
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
    fetcher: options.fetch,
    schema: DashboardDocumentSchema,
  });
}

async function updateDashboardGlobalFilter(
  options: DashboardIdentity &
    UpdateDashboardGlobalFilterRequest & { filterId: string },
): Promise<DashboardDocument> {
  return requestJson({
    url: `${dashboardUrl(options)}/global-filters/${encodeURIComponent(options.filterId)}`,
    init: jsonRequest(
      "PATCH",
      { revision: options.revision, value: options.value },
      options,
    ),
    fetcher: options.fetch,
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
      headers: mergeHeaders(options.headers, { Accept: "application/json" }),
      credentials: options.credentials,
      signal: options.signal,
    },
    fetcher: options.fetch,
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
    fetcher: options.fetch,
    schema: DashboardCardMutationResponseSchema,
  });
}

async function removeDashboardCard(
  options: CardIdentity & RemoveDashboardCardRequest,
): Promise<DashboardCardMutationResponse> {
  return requestJson({
    url: dashboardCardUrl(options),
    init: jsonRequest("DELETE", { revision: options.revision }, options),
    fetcher: options.fetch,
    schema: DashboardCardMutationResponseSchema,
  });
}

async function proposeDashboard(
  options: DashboardAIIdentity & CreateDashboardProposalRequest,
): Promise<CreateDashboardProposalResponse> {
  return requestJson({
    url: `${userAIUrl(options)}/dashboard-proposals`,
    init: jsonRequest(
      "POST",
      {
        prompt: options.prompt,
        dashboardId: options.dashboardId,
        revision: options.revision,
        dataSourceId: options.dataSourceId,
      },
      options,
    ),
    fetcher: options.fetch,
    schema: CreateDashboardProposalResponseSchema,
  });
}

async function validateDashboardProposal(
  options: DashboardAIIdentity & ValidateDashboardProposalRequest,
): Promise<DashboardProposalValidationResult> {
  return requestJson({
    url: `${userAIUrl(options)}/dashboard-proposals/validate`,
    init: jsonRequest(
      "POST",
      {
        proposal: options.proposal,
        dashboardId: options.dashboardId,
        revision: options.revision,
        dataSourceId: options.dataSourceId,
      },
      options,
    ),
    fetcher: options.fetch,
    schema: DashboardProposalValidationResultSchema,
  });
}

async function applyDashboardProposal(
  options: DashboardAIIdentity & ApplyDashboardProposalRequest,
): Promise<ApplyDashboardProposalResponse> {
  return requestJson({
    url: `${userAIUrl(options)}/dashboard-proposals/apply`,
    init: jsonRequest(
      "POST",
      {
        proposal: options.proposal,
        dashboardId: options.dashboardId,
        revision: options.revision,
        dataSourceId: options.dataSourceId,
      },
      options,
    ),
    fetcher: options.fetch,
    schema: ApplyDashboardProposalResponseSchema,
  });
}

function jsonRequest(
  method: "POST" | "PATCH" | "DELETE",
  body: unknown,
  options: RequestOptions,
): RequestInit {
  return {
    method,
    headers: mergeHeaders(options.headers, {
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    credentials: options.credentials,
    body: JSON.stringify(body),
    signal: options.signal,
  };
}

function mergeHeaders(base: HeadersInit | undefined, required: HeadersInit) {
  const headers = new Headers(base);
  new Headers(required).forEach((value, key) => headers.set(key, value));
  return headers;
}

async function requestJson<T>({
  url,
  init,
  schema,
  fetcher,
}: {
  url: string;
  init: RequestInit;
  fetcher?: typeof globalThis.fetch;
  schema: RuntimeSchema<T>;
}): Promise<T> {
  const response = await (fetcher ?? globalThis.fetch)(url, init);
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

function userAIUrl(options: DashboardAIIdentity) {
  return `${apiBaseUrl(options.apiBaseUrl)}/users/${encodeURIComponent(options.userId)}/ai`;
}

function apiBaseUrl(value = DEFAULT_API_BASE_URL) {
  return value.replace(/\/+$/, "");
}

export type GridframeClientOptions = {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  credentials?: RequestCredentials;
};

/** Creates an isolated client whose transport configuration is applied to every operation. */
export function createGridframeClient(configuration: GridframeClientOptions = {}) {
  async function options<T extends object>(input: T): Promise<T & RequestOptions> {
    const headers = typeof configuration.headers === "function"
      ? await configuration.headers()
      : configuration.headers;
    return { ...input, apiBaseUrl: configuration.baseUrl, fetch: configuration.fetch, headers, credentials: configuration.credentials };
  }
  return {
    bootstrapDashboard: async (input: Parameters<typeof bootstrapDashboard>[0]) => bootstrapDashboard(await options(input)),
    fetchDashboardCardData: async (input: CardIdentity & { includeSource?: boolean }): Promise<PanelCardDataResponse> => {
      const configured = await options(input);
      return configured.includeSource
        ? fetchDashboardCardData({ ...configured, includeSource: true })
        : fetchDashboardCardData({ ...configured, includeSource: false });
    },
    updateDashboardLayout: async (input: Parameters<typeof updateDashboardLayout>[0]) => updateDashboardLayout(await options(input)),
    updateDashboardCard: async (input: Parameters<typeof updateDashboardCard>[0]) => updateDashboardCard(await options(input)),
    updateDashboardGlobalFilter: async (input: Parameters<typeof updateDashboardGlobalFilter>[0]) => updateDashboardGlobalFilter(await options(input)),
    listCardLibrary: async (input: Parameters<typeof listCardLibrary>[0]) => listCardLibrary(await options(input)),
    addDashboardCard: async (input: Parameters<typeof addDashboardCard>[0]) => addDashboardCard(await options(input)),
    removeDashboardCard: async (input: Parameters<typeof removeDashboardCard>[0]) => removeDashboardCard(await options(input)),
    proposeDashboard: async (input: Parameters<typeof proposeDashboard>[0]) => proposeDashboard(await options(input)),
    validateDashboardProposal: async (input: Parameters<typeof validateDashboardProposal>[0]) => validateDashboardProposal(await options(input)),
    applyDashboardProposal: async (input: Parameters<typeof applyDashboardProposal>[0]) => applyDashboardProposal(await options(input)),
  };
}
export type GridframeClient = ReturnType<typeof createGridframeClient>;

export {
  DashboardClientError,
  addDashboardCard,
  applyDashboardProposal,
  bootstrapDashboard,
  fetchDashboardCardData,
  listCardLibrary,
  proposeDashboard,
  removeDashboardCard,
  updateDashboardCard,
  updateDashboardGlobalFilter,
  updateDashboardLayout,
  validateDashboardProposal,
};
export const ai = {
  proposeDashboard,
  validateDashboardProposal,
  applyDashboardProposal,
};
export type {
  CardIdentity,
  DashboardAIIdentity,
  DashboardIdentity,
  RequestOptions,
};
