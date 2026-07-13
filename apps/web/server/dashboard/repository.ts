import {
  DASHBOARD_GRID_COLUMNS,
  type CardDeeplinkConfig,
  type CardLibraryItem,
  type DashboardCardLayout,
  type DashboardFooterConfig,
  type DashboardLayoutItem,
  type DashboardSummary,
  type VisualizationType,
  validateDashboardLayout,
} from "@gridframe/core";
import {
  DashboardCardAlreadyAddedError,
  DashboardInvalidLayoutError,
  DashboardInvalidLibraryItemError,
  DashboardNotFoundError,
  DashboardRevisionConflictError,
  type CardLibraryTemplate,
  type DashboardBootstrap,
  type DashboardRepository as GridframeDashboardRepository,
  type DashboardSeed,
  type PersistedDashboard,
  type PersistedDashboardCard,
} from "@gridframe/server";
import { randomUUID } from "node:crypto";

import { cardDefinitions, getCardDefinition } from "./card-definitions";
import { type DashboardDatabase } from "./database";
import { defaultDashboardSeed } from "./seed";

type DashboardCardCreate = {
  libraryItemKey?: string;
  name: string;
  visualization: VisualizationType;
  deeplink?: Omit<CardDeeplinkConfig, "href">;
  layout: DashboardCardLayout;
};

interface DashboardRepository {
  bootstrap(
    ownerUserId: string,
    dashboardId?: string,
    seed?: DashboardSeed,
    cardLibrary?: readonly CardLibraryTemplate[],
  ): Promise<DashboardBootstrap>;
  loadDashboard(
    ownerUserId: string,
    dashboardId: string,
  ): Promise<PersistedDashboard>;
  findOwnedCard(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
  ): Promise<PersistedDashboardCardWithQuery | undefined>;
  updateLayout(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    cards: DashboardLayoutItem[],
  ): Promise<PersistedDashboard>;
  updateCardName(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
    revision: number,
    name: string,
  ): Promise<PersistedDashboard>;
  listCardLibrary(
    ownerUserId: string,
    dashboardId: string,
  ): Promise<CardLibraryItem[]>;
  addCard(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    libraryItemKey: string,
  ): Promise<PersistedDashboard>;
  addCard(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    card: DashboardCardCreate,
  ): Promise<PersistedDashboard>;
  removeCard(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
    revision: number,
  ): Promise<PersistedDashboard>;
}

class NeonDashboardRepository
  implements DashboardRepository, GridframeDashboardRepository
{
  constructor(private readonly database: DashboardDatabase) {}

  async bootstrap(
    ownerUserId: string,
    dashboardId?: string,
    seed: DashboardSeed = defaultDashboardSeed,
    cardLibrary: readonly CardLibraryTemplate[] = Object.values(
      cardDefinitions,
    ),
  ): Promise<DashboardBootstrap> {
    const timestamp = new Date().toISOString();
    const seededCards = seed.cards.map((card, index) => {
      const template = cardLibrary.find(
        (item) => item.key === card.libraryItemKey,
      );
      if (!template) throw new DashboardInvalidLibraryItemError();
      const layout = card.layout ?? {
        x: 0,
        y: index * template.defaultLayout.height,
        ...template.defaultLayout,
      };

      return {
        id: randomUUID(),
        library_item_key: template.key,
        name: template.name,
        visualization: template.visualization,
        source_query: `/api/consumer/cards/${template.key}`,
        deeplink_json: template.deeplinkLabel
          ? { label: template.deeplinkLabel }
          : null,
        grid_x: layout.x,
        grid_y: layout.y,
        grid_width: layout.width,
        grid_height: layout.height,
        sort_order: index,
      };
    });

    await this.database.query(
      `WITH inserted_dashboard AS (
         INSERT INTO dashboards (
           id, owner_user_id, title, description, footer_json,
           is_default, revision, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5::jsonb, TRUE, 1, $6, $6)
         ON CONFLICT (owner_user_id) WHERE is_default DO NOTHING
         RETURNING id
       )
       INSERT INTO dashboard_cards (
         id, dashboard_id, library_item_key, name, visualization,
         source_query, deeplink_json, grid_x, grid_y, grid_width,
         grid_height, sort_order, created_at, updated_at
       )
       SELECT card.id, dashboard.id, card.library_item_key, card.name,
         card.visualization, card.source_query, card.deeplink_json,
         card.grid_x, card.grid_y, card.grid_width, card.grid_height,
         card.sort_order, $6, $6
       FROM inserted_dashboard dashboard
       CROSS JOIN jsonb_to_recordset($7::jsonb) AS card(
         id UUID, library_item_key TEXT, name TEXT, visualization TEXT,
         source_query TEXT, deeplink_json JSONB, grid_x INTEGER,
         grid_y INTEGER, grid_width INTEGER, grid_height INTEGER,
         sort_order INTEGER
       )`,
      [
        randomUUID(),
        ownerUserId,
        seed.title,
        seed.description ?? null,
        JSON.stringify(seed.footer ?? null),
        timestamp,
        JSON.stringify(seededCards),
      ],
    );

    const defaultDashboard = await this.findDefault(ownerUserId);
    if (!defaultDashboard) {
      throw new Error("Default Dashboard could not be created");
    }

    const dashboard = dashboardId
      ? await this.findOwnedDashboard(ownerUserId, dashboardId)
      : defaultDashboard;
    if (!dashboard) throw new DashboardNotFoundError();

    const [dashboards, loadedDashboard] = await Promise.all([
      this.listOwnedDashboards(ownerUserId),
      this.loadDashboardRow(dashboard),
    ]);
    return { dashboards, dashboard: loadedDashboard };
  }

  async loadDashboard(
    ownerUserId: string,
    dashboardId: string,
  ): Promise<PersistedDashboard> {
    const { rows } = await this.database.query<DashboardWithCardsRow>(
      `SELECT dashboard.*,
         COALESCE(
           jsonb_agg(to_jsonb(card) ORDER BY card.sort_order)
             FILTER (WHERE card.id IS NOT NULL),
           '[]'::jsonb
         ) AS cards
       FROM dashboards dashboard
       LEFT JOIN dashboard_cards card ON card.dashboard_id = dashboard.id
       WHERE dashboard.id = $1 AND dashboard.owner_user_id = $2
       GROUP BY dashboard.id`,
      [dashboardId, ownerUserId],
    );
    const row = rows[0];
    if (!row) throw new DashboardNotFoundError();
    return mapDashboard(row, row.cards);
  }

  async findOwnedCard(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
  ): Promise<PersistedDashboardCardWithQuery | undefined> {
    const { rows } = await this.database.query<CardRow>(
      `SELECT c.*
       FROM dashboard_cards c
       JOIN dashboards d ON d.id = c.dashboard_id
       WHERE c.id = $1 AND c.dashboard_id = $2 AND d.owner_user_id = $3`,
      [cardId, dashboardId, ownerUserId],
    );
    return rows[0] ? mapCard(rows[0]) : undefined;
  }

  async updateLayout(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    cards: DashboardLayoutItem[],
  ): Promise<PersistedDashboard> {
    const dashboard = await this.loadDashboard(ownerUserId, dashboardId);
    const validation = validateDashboardLayout(
      cards,
      dashboard.cards.map((card) => card.id),
    );
    if (!validation.valid) {
      throw new DashboardInvalidLayoutError(validation.errors);
    }

    const timestamp = new Date().toISOString();
    const { rows } = await this.database.query<{ revised: boolean }>(
      `WITH revised AS (
         UPDATE dashboards
         SET revision = revision + 1, updated_at = $4
         WHERE id = $1 AND owner_user_id = $2 AND revision = $3
         RETURNING id
       ), updated_cards AS (
         UPDATE dashboard_cards card
         SET grid_x = layout.x, grid_y = layout.y,
           grid_width = layout.width, grid_height = layout.height,
           updated_at = $4
         FROM revised,
           jsonb_to_recordset($5::jsonb) AS layout(
             id UUID, x INTEGER, y INTEGER, width INTEGER, height INTEGER
           )
         WHERE card.id = layout.id AND card.dashboard_id = revised.id
         RETURNING card.id
       )
       SELECT EXISTS(SELECT 1 FROM revised) AS revised`,
      [dashboardId, ownerUserId, revision, timestamp, JSON.stringify(cards)],
    );
    if (!rows[0]?.revised) throw new DashboardRevisionConflictError();
    return this.loadDashboard(ownerUserId, dashboardId);
  }

  async updateCardName(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
    revision: number,
    name: string,
  ): Promise<PersistedDashboard> {
    await this.requireOwnedDashboard(ownerUserId, dashboardId);
    if (!(await this.findOwnedCard(ownerUserId, dashboardId, cardId))) {
      throw new DashboardNotFoundError();
    }

    const { rows } = await this.database.query<{ revised: boolean }>(
      `WITH revised AS (
         UPDATE dashboards dashboard
         SET revision = revision + 1, updated_at = $5
         WHERE id = $1 AND owner_user_id = $2 AND revision = $4
           AND EXISTS (
             SELECT 1 FROM dashboard_cards
             WHERE id = $3 AND dashboard_id = dashboard.id
           )
         RETURNING id
       ), updated_card AS (
         UPDATE dashboard_cards card
         SET name = $6, updated_at = $5
         FROM revised
         WHERE card.id = $3 AND card.dashboard_id = revised.id
         RETURNING card.id
       )
       SELECT EXISTS(SELECT 1 FROM revised) AS revised`,
      [
        dashboardId,
        ownerUserId,
        cardId,
        revision,
        new Date().toISOString(),
        name,
      ],
    );
    if (!rows[0]?.revised) throw new DashboardRevisionConflictError();
    return this.loadDashboard(ownerUserId, dashboardId);
  }

  async listCardLibrary(
    ownerUserId: string,
    dashboardId: string,
  ): Promise<CardLibraryItem[]> {
    const dashboard = await this.loadDashboard(ownerUserId, dashboardId);
    const installed = new Map(
      dashboard.cards.map((card) => [card.libraryItemKey, card.id]),
    );
    return Object.values(cardDefinitions).map((definition) => ({
      key: definition.key,
      name: definition.name,
      description: definition.description,
      visualization: definition.visualization,
      defaultLayout: definition.defaultLayout,
      addedCardId: installed.get(definition.key),
    }));
  }

  addCard(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    libraryItemKey: string,
  ): Promise<PersistedDashboard>;
  addCard(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    card: DashboardCardCreate,
  ): Promise<PersistedDashboard>;
  async addCard(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    cardOrLibraryItemKey: string | DashboardCardCreate,
  ): Promise<PersistedDashboard> {
    const dashboard = await this.loadDashboard(ownerUserId, dashboardId);
    const card =
      typeof cardOrLibraryItemKey === "string"
        ? this.cardFromExampleDefinition(dashboard, cardOrLibraryItemKey)
        : cardOrLibraryItemKey;
    if (
      card.libraryItemKey &&
      dashboard.cards.some(
        (dashboardCard) => dashboardCard.libraryItemKey === card.libraryItemKey,
      )
    ) {
      throw new DashboardCardAlreadyAddedError();
    }

    const timestamp = new Date().toISOString();
    try {
      const { rows } = await this.database.query<{ revised: boolean }>(
        `WITH revised AS (
           UPDATE dashboards
           SET revision = revision + 1, updated_at = $4
           WHERE id = $1 AND owner_user_id = $2 AND revision = $3
           RETURNING id
         ), inserted_card AS (
           INSERT INTO dashboard_cards (
             id, dashboard_id, library_item_key, name, visualization,
             source_query, deeplink_json, grid_x, grid_y, grid_width,
             grid_height, sort_order, created_at, updated_at
           )
           SELECT $5, revised.id, $6, $7, $8, $9, $10::jsonb,
             $11, $12, $13, $14, $15, $4, $4
           FROM revised
           RETURNING id
         )
         SELECT EXISTS(SELECT 1 FROM revised) AS revised`,
        [
          dashboardId,
          ownerUserId,
          revision,
          timestamp,
          randomUUID(),
          card.libraryItemKey ?? null,
          card.name,
          card.visualization,
          card.libraryItemKey
            ? `/api/consumer/cards/${card.libraryItemKey}`
            : "",
          JSON.stringify(card.deeplink ?? null),
          card.layout.x,
          card.layout.y,
          card.layout.width,
          card.layout.height,
          dashboard.cards.reduce(
            (max, dashboardCard) => Math.max(max, dashboardCard.sortOrder),
            -1,
          ) + 1,
        ],
      );
      if (!rows[0]?.revised) throw new DashboardRevisionConflictError();
    } catch (error) {
      if (isUniqueViolation(error)) throw new DashboardCardAlreadyAddedError();
      throw error;
    }

    return this.loadDashboard(ownerUserId, dashboardId);
  }

  async removeCard(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
    revision: number,
  ): Promise<PersistedDashboard> {
    await this.requireOwnedDashboard(ownerUserId, dashboardId);
    if (!(await this.findOwnedCard(ownerUserId, dashboardId, cardId))) {
      throw new DashboardNotFoundError();
    }

    const { rows } = await this.database.query<{ revised: boolean }>(
      `WITH revised AS (
         UPDATE dashboards dashboard
         SET revision = revision + 1, updated_at = $5
         WHERE id = $1 AND owner_user_id = $2 AND revision = $4
           AND EXISTS (
             SELECT 1 FROM dashboard_cards
             WHERE id = $3 AND dashboard_id = dashboard.id
           )
         RETURNING id
       ), deleted_card AS (
         DELETE FROM dashboard_cards card
         USING revised
         WHERE card.id = $3 AND card.dashboard_id = revised.id
         RETURNING card.id
       )
       SELECT EXISTS(SELECT 1 FROM revised) AS revised`,
      [dashboardId, ownerUserId, cardId, revision, new Date().toISOString()],
    );
    if (!rows[0]?.revised) throw new DashboardRevisionConflictError();
    return this.loadDashboard(ownerUserId, dashboardId);
  }

  private async requireOwnedDashboard(
    ownerUserId: string,
    dashboardId: string,
  ) {
    const dashboard = await this.findOwnedDashboard(ownerUserId, dashboardId);
    if (!dashboard) throw new DashboardNotFoundError();
    return dashboard;
  }

  private async findDefault(ownerUserId: string) {
    const { rows } = await this.database.query<DashboardRow>(
      "SELECT * FROM dashboards WHERE owner_user_id = $1 AND is_default",
      [ownerUserId],
    );
    return rows[0];
  }

  private async findOwnedDashboard(ownerUserId: string, dashboardId: string) {
    const { rows } = await this.database.query<DashboardRow>(
      "SELECT * FROM dashboards WHERE id = $1 AND owner_user_id = $2",
      [dashboardId, ownerUserId],
    );
    return rows[0];
  }

  private async listOwnedDashboards(
    ownerUserId: string,
  ): Promise<DashboardSummary[]> {
    const { rows } = await this.database.query<
      Pick<DashboardRow, "id" | "title" | "is_default">
    >(
      `SELECT id, title, is_default
       FROM dashboards
       WHERE owner_user_id = $1
       ORDER BY is_default DESC, created_at ASC`,
      [ownerUserId],
    );
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      isDefault: row.is_default,
    }));
  }

  private async loadDashboardRow(
    row: DashboardRow,
  ): Promise<PersistedDashboard> {
    return this.loadDashboard(row.owner_user_id, row.id);
  }

  private cardFromExampleDefinition(
    dashboard: PersistedDashboard,
    libraryItemKey: string,
  ): DashboardCardCreate {
    const definition = getCardDefinition(libraryItemKey);
    if (!definition) throw new DashboardInvalidLibraryItemError();
    return {
      libraryItemKey: definition.key,
      name: definition.name,
      visualization: definition.visualization,
      deeplink: { label: definition.deeplinkLabel },
      layout: firstAvailableLayout(dashboard.cards, definition.defaultLayout),
    };
  }
}

type PersistedDashboardCardWithQuery = PersistedDashboardCard & {
  sourceQuery: string;
};

type DashboardRow = Record<string, unknown> & {
  id: string;
  owner_user_id: string;
  title: string;
  description: string | null;
  footer_json: unknown | null;
  is_default: boolean;
  revision: number;
};

type CardRow = Record<string, unknown> & {
  id: string;
  dashboard_id: string;
  library_item_key: string | null;
  name: string;
  visualization: VisualizationType;
  source_query: string;
  deeplink_json: unknown | null;
  grid_x: number;
  grid_y: number;
  grid_width: number;
  grid_height: number;
  sort_order: number;
};

type DashboardWithCardsRow = DashboardRow & {
  cards: CardRow[];
};

function mapDashboard(row: DashboardRow, cards: CardRow[]): PersistedDashboard {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    title: row.title,
    description: row.description ?? undefined,
    footer: parseJson<DashboardFooterConfig>(row.footer_json),
    isDefault: row.is_default,
    revision: row.revision,
    cards: cards.map(mapCard),
  };
}

function mapCard(row: CardRow): PersistedDashboardCardWithQuery {
  return {
    id: row.id,
    dashboardId: row.dashboard_id,
    libraryItemKey: row.library_item_key ?? undefined,
    name: row.name,
    visualization: row.visualization,
    sourceQuery: row.source_query,
    deeplink: parseJson<Omit<CardDeeplinkConfig, "href">>(row.deeplink_json),
    layout: {
      x: row.grid_x,
      y: row.grid_y,
      width: row.grid_width,
      height: row.grid_height,
    },
    sortOrder: row.sort_order,
  };
}

function parseJson<T>(value: unknown | null): T | undefined {
  if (value === null || value === undefined) return undefined;
  return (typeof value === "string" ? JSON.parse(value) : value) as T;
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function firstAvailableLayout(
  cards: readonly { layout: DashboardCardLayout }[],
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

export {
  DashboardCardAlreadyAddedError,
  DashboardInvalidLayoutError,
  DashboardInvalidLibraryItemError,
  DashboardNotFoundError,
  DashboardRevisionConflictError,
  NeonDashboardRepository,
};
export type {
  DashboardBootstrap,
  DashboardRepository,
  PersistedDashboard,
  PersistedDashboardCard,
  PersistedDashboardCardWithQuery,
};
