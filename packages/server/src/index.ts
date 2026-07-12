import {
  AddDashboardCardRequestSchema,
  CardLibraryResponseSchema,
  DashboardApiErrorSchema,
  DashboardBootstrapRequestSchema,
  DashboardDocumentSchema,
  DASHBOARD_GRID_COLUMNS,
  PanelCardDataResponseSchema,
  RemoveDashboardCardRequestSchema,
  UpdateDashboardCardRequestSchema,
  UpdateDashboardLayoutRequestSchema,
  type CardDeeplinkConfig,
  type CardLibraryItem,
  type DashboardApiError,
  type DashboardBootstrapResponse,
  type DashboardCardLayout,
  type DashboardFooterConfig,
  type DashboardLayoutItem,
  type DashboardSummary,
  type PanelCardDataResponse,
  type VisualizationType,
} from "@gridframe/core";
import { validateDashboardLayout } from "@gridframe/core";

type MaybePromise<T> = T | Promise<T>;

type CardLibraryTemplate = {
  key: string;
  name: string;
  description?: string;
  visualization: VisualizationType;
  defaultLayout: {
    width: number;
    height: number;
  };
  deeplinkLabel?: string;
};

type DashboardSeedCard = {
  libraryItemKey: string;
  layout?: DashboardCardLayout;
};

type DashboardSeed = {
  title: string;
  description?: string;
  footer?: DashboardFooterConfig;
  cards: DashboardSeedCard[];
};

type PersistedDashboardCard = {
  id: string;
  dashboardId: string;
  libraryItemKey?: string;
  name: string;
  visualization: VisualizationType;
  deeplink?: Omit<CardDeeplinkConfig, "href">;
  layout: DashboardCardLayout;
  sortOrder: number;
};

type PersistedDashboard = {
  id: string;
  ownerUserId: string;
  title: string;
  description?: string;
  footer?: DashboardFooterConfig;
  isDefault: boolean;
  revision: number;
  cards: PersistedDashboardCard[];
};

type DashboardBootstrap = {
  dashboards: DashboardSummary[];
  dashboard: PersistedDashboard;
};

type DashboardCardCreate = Omit<
  PersistedDashboardCard,
  "id" | "dashboardId" | "sortOrder"
>;

interface DashboardRepository {
  bootstrap(
    ownerUserId: string,
    dashboardId: string | undefined,
    seed: DashboardSeed,
    cardLibrary: readonly CardLibraryTemplate[],
  ): MaybePromise<DashboardBootstrap>;
  loadDashboard(
    ownerUserId: string,
    dashboardId: string,
  ): MaybePromise<PersistedDashboard>;
  updateLayout(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    cards: DashboardLayoutItem[],
  ): MaybePromise<PersistedDashboard>;
  updateCardName(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
    revision: number,
    name: string,
  ): MaybePromise<PersistedDashboard>;
  addCard(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    card: DashboardCardCreate,
  ): MaybePromise<PersistedDashboard>;
  removeCard(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
    revision: number,
  ): MaybePromise<PersistedDashboard>;
  findOwnedCard(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
  ): MaybePromise<PersistedDashboardCard | undefined>;
}

type DashboardHandlerOptions = {
  repository: DashboardRepository;
  cardLibrary:
    | readonly CardLibraryTemplate[]
    | ((context: DashboardContext) => MaybePromise<readonly CardLibraryTemplate[]>);
  defaultDashboard: (context: DashboardContext) => MaybePromise<DashboardSeed>;
  resolveCardData: (
    input: CardDataResolverInput,
  ) => MaybePromise<PanelCardDataResponse>;
  urls?: DashboardUrlOptions;
};

type DashboardUrlOptions = {
  apiBasePath?: string;
  dashboardBasePath?: string;
};

type DashboardContext = {
  userId: string;
};

type DashboardIdentity = DashboardContext & {
  dashboardId: string;
};

type CardIdentity = DashboardIdentity & {
  cardId: string;
};

type CardDataResolverInput = CardIdentity & {
  card: PersistedDashboardCard;
  request: Request;
};

class DashboardNotFoundError extends Error {
  constructor() {
    super("Dashboard not found");
    this.name = "DashboardNotFoundError";
  }
}

class DashboardRevisionConflictError extends Error {
  constructor() {
    super("Dashboard revision conflict");
    this.name = "DashboardRevisionConflictError";
  }
}

class DashboardInvalidLayoutError extends Error {
  constructor(readonly errors: string[]) {
    super(errors.join("; "));
    this.name = "DashboardInvalidLayoutError";
  }
}

class DashboardCardAlreadyAddedError extends Error {
  constructor() {
    super("Card is already on this Dashboard");
    this.name = "DashboardCardAlreadyAddedError";
  }
}

class DashboardInvalidLibraryItemError extends Error {
  constructor() {
    super("Unknown Card library item");
    this.name = "DashboardInvalidLibraryItemError";
  }
}

function createDashboardHandlers(options: DashboardHandlerOptions) {
  const urls = {
    apiBasePath: options.urls?.apiBasePath ?? "/api/gridframe",
    dashboardBasePath: options.urls?.dashboardBasePath ?? "/gridframe",
  };

  return {
    bootstrap: async (request: Request, context: DashboardContext) => {
      const parsedRequest = DashboardBootstrapRequestSchema.safeParse(
        await readJson(request),
      );

      if (!parsedRequest.success || !isIdentitySegment(context.userId)) {
        return errorResponse(
          400,
          "INVALID_REQUEST",
          "Invalid bootstrap request",
        );
      }

      try {
        const [seed, cardLibrary] = await Promise.all([
          options.defaultDashboard(context),
          resolveCardLibrary(options.cardLibrary, context),
        ]);
        const result = await options.repository.bootstrap(
          context.userId,
          parsedRequest.data.dashboardId,
          seed,
          cardLibrary,
        );

        return Response.json(serializeDashboardBootstrap(result, urls));
      } catch (error) {
        if (error instanceof DashboardNotFoundError) {
          return errorResponse(
            404,
            "DASHBOARD_NOT_FOUND",
            "Dashboard not found",
          );
        }
        if (error instanceof DashboardInvalidLibraryItemError) {
          return errorResponse(
            400,
            "INVALID_REQUEST",
            "Unknown Card library item",
          );
        }

        return errorResponse(
          500,
          "DASHBOARD_LOAD_FAILED",
          "Dashboard could not be loaded",
        );
      }
    },

    updateLayout: async (request: Request, identity: DashboardIdentity) => {
      const parsed = UpdateDashboardLayoutRequestSchema.safeParse(
        await readJson(request),
      );
      const revision = parsed.success
        ? parseRevision(parsed.data.revision)
        : undefined;

      if (!parsed.success || revision === undefined || !isDashboard(identity)) {
        return errorResponse(
          400,
          "INVALID_REQUEST",
          "Invalid Dashboard layout request",
        );
      }

      try {
        const dashboard = await options.repository.loadDashboard(
          identity.userId,
          identity.dashboardId,
        );
        const validation = validateDashboardLayout(
          parsed.data.cards,
          dashboard.cards.map((card) => card.id),
        );

        if (!validation.valid) {
          throw new DashboardInvalidLayoutError(validation.errors);
        }

        const updated = await options.repository.updateLayout(
          identity.userId,
          identity.dashboardId,
          revision,
          parsed.data.cards,
        );

        return Response.json(serializeDashboardDocument(updated, urls));
      } catch (error) {
        return mutationError(error, "Invalid Dashboard layout");
      }
    },

    updateCard: async (request: Request, identity: CardIdentity) => {
      const parsed = UpdateDashboardCardRequestSchema.safeParse(
        await readJson(request),
      );
      const revision = parsed.success
        ? parseRevision(parsed.data.revision)
        : undefined;
      const name = parsed.success ? parsed.data.name.trim() : "";

      if (
        !parsed.success ||
        revision === undefined ||
        !name ||
        !isCard(identity)
      ) {
        return errorResponse(
          400,
          "INVALID_REQUEST",
          "Invalid Card update request",
        );
      }

      try {
        const updated = await options.repository.updateCardName(
          identity.userId,
          identity.dashboardId,
          identity.cardId,
          revision,
          name,
        );

        return Response.json(serializeDashboardDocument(updated, urls));
      } catch (error) {
        return mutationError(error, "Invalid Card update request");
      }
    },

    listCardLibrary: async (_request: Request, identity: DashboardIdentity) => {
      if (!isDashboard(identity)) {
        return errorResponse(
          400,
          "INVALID_REQUEST",
          "Invalid Card library request",
        );
      }

      try {
        const [dashboard, cardLibrary] = await Promise.all([
          options.repository.loadDashboard(identity.userId, identity.dashboardId),
          resolveCardLibrary(options.cardLibrary, identity),
        ]);

        return Response.json(buildCardLibraryResponse(dashboard, cardLibrary));
      } catch (error) {
        return libraryError(error);
      }
    },

    addCard: async (request: Request, identity: DashboardIdentity) => {
      const parsed = AddDashboardCardRequestSchema.safeParse(
        await readJson(request),
      );
      const revision = parsed.success
        ? parseRevision(parsed.data.revision)
        : undefined;

      if (!parsed.success || revision === undefined || !isDashboard(identity)) {
        return errorResponse(400, "INVALID_REQUEST", "Invalid Card add request");
      }

      try {
        const [dashboard, cardLibrary] = await Promise.all([
          options.repository.loadDashboard(identity.userId, identity.dashboardId),
          resolveCardLibrary(options.cardLibrary, identity),
        ]);
        const template = cardLibrary.find(
          (item) => item.key === parsed.data.libraryItemKey,
        );

        if (!template) {
          throw new DashboardInvalidLibraryItemError();
        }
        if (
          dashboard.cards.some(
            (card) => card.libraryItemKey === parsed.data.libraryItemKey,
          )
        ) {
          throw new DashboardCardAlreadyAddedError();
        }

        const updated = await options.repository.addCard(
          identity.userId,
          identity.dashboardId,
          revision,
          {
            libraryItemKey: template.key,
            name: template.name,
            visualization: template.visualization,
            deeplink: template.deeplinkLabel
              ? { label: template.deeplinkLabel }
              : undefined,
            layout: firstAvailableLayout(dashboard.cards, template.defaultLayout),
          },
        );

        return Response.json({
          dashboard: serializeDashboardDocument(updated, urls),
          cardLibrary: buildCardLibraryResponse(updated, cardLibrary),
        });
      } catch (error) {
        return libraryError(error);
      }
    },

    removeCard: async (request: Request, identity: CardIdentity) => {
      const parsed = RemoveDashboardCardRequestSchema.safeParse(
        await readJson(request),
      );
      const revision = parsed.success
        ? parseRevision(parsed.data.revision)
        : undefined;

      if (!parsed.success || revision === undefined || !isCard(identity)) {
        return errorResponse(
          400,
          "INVALID_REQUEST",
          "Invalid Card remove request",
        );
      }

      try {
        const cardLibrary = await resolveCardLibrary(
          options.cardLibrary,
          identity,
        );
        const updated = await options.repository.removeCard(
          identity.userId,
          identity.dashboardId,
          identity.cardId,
          revision,
        );

        return Response.json({
          dashboard: serializeDashboardDocument(updated, urls),
          cardLibrary: buildCardLibraryResponse(updated, cardLibrary),
        });
      } catch (error) {
        return libraryError(error);
      }
    },

    fetchCardData: async (request: Request, identity: CardIdentity) => {
      if (!isCard(identity)) {
        return errorResponse(400, "INVALID_REQUEST", "Invalid Card data request");
      }

      try {
        const card = await options.repository.findOwnedCard(
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

        const result = await options.resolveCardData({
          ...identity,
          card,
          request,
        });
        const parsed = PanelCardDataResponseSchema.safeParse(result);

        if (!parsed.success) {
          return cardQueryFailed();
        }

        return Response.json(parsed.data);
      } catch {
        return cardQueryFailed();
      }
    },
  };
}

function serializeDashboardBootstrap(
  result: DashboardBootstrap,
  urls: Required<DashboardUrlOptions>,
): DashboardBootstrapResponse {
  return {
    dashboards: result.dashboards,
    dashboard: serializeDashboardDocument(result.dashboard, urls),
  };
}

function serializeDashboardDocument(
  dashboard: PersistedDashboard,
  urls: Required<DashboardUrlOptions>,
) {
  const ownerId = encodeURIComponent(dashboard.ownerUserId);
  const dashboardId = encodeURIComponent(dashboard.id);

  return DashboardDocumentSchema.parse({
    id: dashboard.id,
    revision: String(dashboard.revision),
    config: {
      title: dashboard.title,
      description: dashboard.description,
      footer: dashboard.footer,
      cards: dashboard.cards.map((card) => {
        const cardId = encodeURIComponent(card.id);

        return {
          id: card.id,
          name: card.name,
          visualization: card.visualization,
          query:
            `${urls.apiBasePath}/users/${ownerId}` +
            `/dashboards/${dashboardId}/cards/${cardId}/data`,
          deeplink: card.deeplink
            ? {
                href:
                  `${urls.dashboardBasePath}/users/${ownerId}` +
                  `/dashboards/${dashboardId}/cards/${cardId}`,
                label: card.deeplink.label,
              }
            : undefined,
          layout: card.layout,
        };
      }),
    },
  });
}

function buildCardLibraryResponse(
  dashboard: PersistedDashboard,
  cardLibrary: readonly CardLibraryTemplate[],
) {
  const installed = new Map(
    dashboard.cards.map((card) => [card.libraryItemKey, card.id]),
  );

  return CardLibraryResponseSchema.parse({
    items: cardLibrary.map(
      (template): CardLibraryItem => ({
        key: template.key,
        name: template.name,
        description: template.description,
        visualization: template.visualization,
        defaultLayout: template.defaultLayout,
        addedCardId: installed.get(template.key),
      }),
    ),
  });
}

function firstAvailableLayout(
  cards: readonly PersistedDashboardCard[],
  size: { width: number; height: number },
): DashboardCardLayout {
  if (size.width > DASHBOARD_GRID_COLUMNS) {
    throw new DashboardInvalidLayoutError([
      `Card width ${size.width} exceeds the ${DASHBOARD_GRID_COLUMNS}-column grid`,
    ]);
  }
  for (let y = 0; ; y += 1) {
    for (let x = 0; x + size.width <= DASHBOARD_GRID_COLUMNS; x += 1) {
      const candidate = { x, y, ...size };
      if (!cards.some((card) => layoutsOverlap(candidate, card.layout))) {
        return candidate;
      }
    }
  }
}

function layoutsOverlap(a: DashboardCardLayout, b: DashboardCardLayout) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

async function resolveCardLibrary(
  cardLibrary: DashboardHandlerOptions["cardLibrary"],
  context: DashboardContext,
) {
  return typeof cardLibrary === "function"
    ? cardLibrary(context)
    : cardLibrary;
}

function mutationError(error: unknown, invalidMessage: string) {
  if (error instanceof DashboardRevisionConflictError) {
    return errorResponse(
      409,
      "REVISION_CONFLICT",
      "Dashboard was changed by another request",
    );
  }
  if (error instanceof DashboardNotFoundError) {
    return errorResponse(404, "DASHBOARD_NOT_FOUND", "Dashboard not found");
  }
  if (error instanceof DashboardInvalidLayoutError) {
    return errorResponse(400, "INVALID_REQUEST", invalidMessage);
  }
  return errorResponse(
    500,
    "DASHBOARD_LOAD_FAILED",
    "Dashboard could not be updated",
  );
}

function libraryError(error: unknown) {
  if (error instanceof DashboardRevisionConflictError) {
    return errorResponse(
      409,
      "REVISION_CONFLICT",
      "Dashboard was changed by another request",
    );
  }
  if (error instanceof DashboardCardAlreadyAddedError) {
    return errorResponse(
      409,
      "CARD_ALREADY_ADDED",
      "Card is already on this Dashboard",
    );
  }
  if (error instanceof DashboardInvalidLibraryItemError) {
    return errorResponse(400, "INVALID_REQUEST", "Unknown Card library item");
  }
  if (error instanceof DashboardNotFoundError) {
    return errorResponse(404, "DASHBOARD_NOT_FOUND", "Dashboard not found");
  }
  return errorResponse(
    500,
    "DASHBOARD_LOAD_FAILED",
    "Dashboard could not be updated",
  );
}

function errorResponse(
  status: number,
  code: DashboardApiError["error"]["code"],
  message: string,
) {
  return Response.json(
    DashboardApiErrorSchema.parse({ error: { code, message } }),
    { status },
  );
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

function parseRevision(revision: string) {
  if (!/^[1-9]\d*$/.test(revision)) {
    return undefined;
  }
  const value = Number(revision);
  return Number.isSafeInteger(value) ? value : undefined;
}

function isDashboard(identity: DashboardIdentity) {
  return (
    isIdentitySegment(identity.userId) &&
    isIdentitySegment(identity.dashboardId)
  );
}

function isCard(identity: CardIdentity) {
  return isDashboard(identity) && isIdentitySegment(identity.cardId);
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

export {
  DashboardCardAlreadyAddedError,
  DashboardInvalidLayoutError,
  DashboardInvalidLibraryItemError,
  DashboardNotFoundError,
  DashboardRevisionConflictError,
  createDashboardHandlers,
};
export type {
  CardDataResolverInput,
  CardLibraryTemplate,
  DashboardBootstrap,
  DashboardHandlerOptions,
  DashboardRepository,
  DashboardSeed,
  DashboardSeedCard,
  PersistedDashboard,
  PersistedDashboardCard,
};
