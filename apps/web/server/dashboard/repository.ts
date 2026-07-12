import {
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
  type DashboardRepository as GridframeDashboardRepository,
  type DashboardSeed,
} from "@gridframe/server";
import { randomUUID } from "node:crypto";
import { type Database } from "better-sqlite3";

import { defaultDashboardSeed } from "./seed";
import { cardDefinitions, getCardDefinition } from "./card-definitions";

type PersistedDashboardCard = {
  id: string;
  dashboardId: string;
  libraryItemKey?: string;
  name: string;
  visualization: VisualizationType;
  sourceQuery: string;
  deeplink?: Omit<CardDeeplinkConfig, "href">;
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
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
  ): DashboardBootstrap;
  loadDashboard(ownerUserId: string, dashboardId: string): PersistedDashboard;
  findOwnedCard(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
  ): PersistedDashboardCard | undefined;
  updateLayout(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    cards: DashboardLayoutItem[],
  ): PersistedDashboard;
  updateCardName(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
    revision: number,
    name: string,
  ): PersistedDashboard;
  listCardLibrary(ownerUserId: string, dashboardId: string): CardLibraryItem[];
  addCard(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    libraryItemKey: string,
  ): PersistedDashboard;
  addCard(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    card: DashboardCardCreate,
  ): PersistedDashboard;
  removeCard(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
    revision: number,
  ): PersistedDashboard;
}

class SqliteDashboardRepository
  implements DashboardRepository, GridframeDashboardRepository
{
  constructor(private readonly database: Database) {}

  bootstrap(
    ownerUserId: string,
    dashboardId?: string,
    seed: DashboardSeed = defaultDashboardSeed,
    cardLibrary: readonly CardLibraryTemplate[] = Object.values(
      cardDefinitions,
    ),
  ): DashboardBootstrap {
    return this.database
      .transaction(() => {
        let defaultDashboard = this.findDefault(ownerUserId);

        if (!defaultDashboard) {
          this.seedDefault(ownerUserId, seed, cardLibrary);
          defaultDashboard = this.findDefault(ownerUserId);
        }

        if (!defaultDashboard) {
          throw new Error("Default Dashboard could not be created");
        }

        const dashboard = dashboardId
          ? this.findOwnedDashboard(ownerUserId, dashboardId)
          : defaultDashboard;

        if (!dashboard) {
          throw new DashboardNotFoundError();
        }

        return {
          dashboards: this.listOwnedDashboards(ownerUserId),
          dashboard: this.loadDashboardRow(dashboard),
        };
      })
      .immediate();
  }

  loadDashboard(ownerUserId: string, dashboardId: string): PersistedDashboard {
    return this.loadDashboardRow(
      this.requireOwnedDashboard(ownerUserId, dashboardId),
    );
  }

  findOwnedCard(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
  ): PersistedDashboardCard | undefined {
    const row = this.database
      .prepare(
        `SELECT c.*
         FROM dashboard_cards c
         JOIN dashboards d ON d.id = c.dashboard_id
         WHERE c.id = ? AND c.dashboard_id = ? AND d.owner_user_id = ?`,
      )
      .get(cardId, dashboardId, ownerUserId) as CardRow | undefined;

    return row ? mapCard(row) : undefined;
  }

  updateLayout(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    cards: DashboardLayoutItem[],
  ): PersistedDashboard {
    return this.database.transaction(() => {
      const dashboard = this.requireOwnedDashboard(ownerUserId, dashboardId);
      const currentCards = this.loadDashboardRow(dashboard).cards;
      const validation = validateDashboardLayout(
        cards,
        currentCards.map((card) => card.id),
      );

      if (!validation.valid) {
        throw new DashboardInvalidLayoutError(validation.errors);
      }

      this.incrementRevision(dashboardId, revision);
      const updateCard = this.database.prepare(
        `UPDATE dashboard_cards
         SET grid_x = ?, grid_y = ?, grid_width = ?, grid_height = ?, updated_at = ?
         WHERE id = ? AND dashboard_id = ?`,
      );
      const timestamp = new Date().toISOString();

      for (const card of cards) {
        updateCard.run(
          card.x,
          card.y,
          card.width,
          card.height,
          timestamp,
          card.id,
          dashboardId,
        );
      }

      return this.loadDashboardRow(
        this.requireOwnedDashboard(ownerUserId, dashboardId),
      );
    })();
  }

  updateCardName(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
    revision: number,
    name: string,
  ): PersistedDashboard {
    return this.database.transaction(() => {
      this.requireOwnedDashboard(ownerUserId, dashboardId);
      const card = this.findOwnedCard(ownerUserId, dashboardId, cardId);

      if (!card) {
        throw new DashboardNotFoundError();
      }

      this.incrementRevision(dashboardId, revision);
      this.database
        .prepare(
          `UPDATE dashboard_cards SET name = ?, updated_at = ?
           WHERE id = ? AND dashboard_id = ?`,
        )
        .run(name, new Date().toISOString(), cardId, dashboardId);

      return this.loadDashboardRow(
        this.requireOwnedDashboard(ownerUserId, dashboardId),
      );
    })();
  }

  listCardLibrary(ownerUserId: string, dashboardId: string): CardLibraryItem[] {
    const dashboard = this.loadDashboardRow(
      this.requireOwnedDashboard(ownerUserId, dashboardId),
    );
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
  ): PersistedDashboard;
  addCard(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    card: DashboardCardCreate,
  ): PersistedDashboard;
  addCard(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    cardOrLibraryItemKey: string | DashboardCardCreate,
  ): PersistedDashboard {
    return this.database.transaction(() => {
      const dashboard = this.loadDashboardRow(
        this.requireOwnedDashboard(ownerUserId, dashboardId),
      );
      const card =
        typeof cardOrLibraryItemKey === "string"
          ? this.cardFromExampleDefinition(dashboard, cardOrLibraryItemKey)
          : cardOrLibraryItemKey;
      if (card.libraryItemKey) {
        if (
          dashboard.cards.some(
            (dashboardCard) =>
              dashboardCard.libraryItemKey === card.libraryItemKey,
          )
        ) {
          throw new DashboardCardAlreadyAddedError();
        }
      }
      this.incrementRevision(dashboardId, revision);
      const timestamp = new Date().toISOString();
      this.database
        .prepare(
          `INSERT INTO dashboard_cards (
        id, dashboard_id, library_item_key, name, visualization, source_query,
        deeplink_json, grid_x, grid_y, grid_width, grid_height, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          randomUUID(),
          dashboardId,
          card.libraryItemKey,
          card.name,
          card.visualization,
          card.libraryItemKey ? `/api/consumer/cards/${card.libraryItemKey}` : "",
          card.deeplink ? JSON.stringify(card.deeplink) : null,
          card.layout.x,
          card.layout.y,
          card.layout.width,
          card.layout.height,
          dashboard.cards.reduce(
            (max, card) => Math.max(max, card.sortOrder),
            -1,
          ) + 1,
          timestamp,
          timestamp,
        );
      return this.loadDashboardRow(
        this.requireOwnedDashboard(ownerUserId, dashboardId),
      );
    })();
  }

  removeCard(
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
    revision: number,
  ) {
    return this.database.transaction(() => {
      this.requireOwnedDashboard(ownerUserId, dashboardId);
      if (!this.findOwnedCard(ownerUserId, dashboardId, cardId))
        throw new DashboardNotFoundError();
      this.incrementRevision(dashboardId, revision);
      this.database
        .prepare(
          "DELETE FROM dashboard_cards WHERE id = ? AND dashboard_id = ?",
        )
        .run(cardId, dashboardId);
      return this.loadDashboardRow(
        this.requireOwnedDashboard(ownerUserId, dashboardId),
      );
    })();
  }

  private requireOwnedDashboard(ownerUserId: string, dashboardId: string) {
    const dashboard = this.findOwnedDashboard(ownerUserId, dashboardId);
    if (!dashboard) {
      throw new DashboardNotFoundError();
    }
    return dashboard;
  }

  private incrementRevision(dashboardId: string, revision: number) {
    const result = this.database
      .prepare(
        `UPDATE dashboards
         SET revision = revision + 1, updated_at = ?
         WHERE id = ? AND revision = ?`,
      )
      .run(new Date().toISOString(), dashboardId, revision);

    if (result.changes !== 1) {
      throw new DashboardRevisionConflictError();
    }
  }

  private findDefault(ownerUserId: string) {
    return this.database
      .prepare(
        "SELECT * FROM dashboards WHERE owner_user_id = ? AND is_default = 1",
      )
      .get(ownerUserId) as DashboardRow | undefined;
  }

  private findOwnedDashboard(ownerUserId: string, dashboardId: string) {
    return this.database
      .prepare("SELECT * FROM dashboards WHERE id = ? AND owner_user_id = ?")
      .get(dashboardId, ownerUserId) as DashboardRow | undefined;
  }

  private listOwnedDashboards(ownerUserId: string): DashboardSummary[] {
    const rows = this.database
      .prepare(
        `SELECT id, title, is_default
         FROM dashboards
         WHERE owner_user_id = ?
         ORDER BY is_default DESC, created_at ASC`,
      )
      .all(ownerUserId) as Array<
      Pick<DashboardRow, "id" | "title" | "is_default">
    >;

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      isDefault: Boolean(row.is_default),
    }));
  }

  private loadDashboardRow(row: DashboardRow): PersistedDashboard {
    const cards = this.database
      .prepare(
        "SELECT * FROM dashboard_cards WHERE dashboard_id = ? ORDER BY sort_order ASC",
      )
      .all(row.id) as CardRow[];

    return {
      id: row.id,
      ownerUserId: row.owner_user_id,
      title: row.title,
      description: row.description ?? undefined,
      footer: parseJson<DashboardFooterConfig>(row.footer_json),
      isDefault: Boolean(row.is_default),
      revision: row.revision,
      cards: cards.map(mapCard),
    };
  }

  private seedDefault(
    ownerUserId: string,
    seed: DashboardSeed,
    cardLibrary: readonly CardLibraryTemplate[],
  ) {
    const dashboardId = randomUUID();
    const timestamp = new Date().toISOString();

    this.database
      .prepare(
        `INSERT INTO dashboards (
          id, owner_user_id, title, description, footer_json,
          is_default, revision, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)`,
      )
      .run(
        dashboardId,
        ownerUserId,
        seed.title,
        seed.description,
        JSON.stringify(seed.footer),
        timestamp,
        timestamp,
      );

    const insertCard = this.database.prepare(
      `INSERT INTO dashboard_cards (
        id, dashboard_id, library_item_key, name, visualization,
        source_query, deeplink_json, grid_x, grid_y, grid_width,
        grid_height, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    seed.cards.forEach((card, index) => {
      const template = cardLibrary.find(
        (item) => item.key === card.libraryItemKey,
      );
      if (!template) throw new DashboardInvalidLibraryItemError();
      const layout = card.layout ?? {
        x: 0,
        y: index * template.defaultLayout.height,
        ...template.defaultLayout,
      };

      insertCard.run(
        randomUUID(),
        dashboardId,
        template.key,
        template.name,
        template.visualization,
        `/api/consumer/cards/${template.key}`,
        template.deeplinkLabel
          ? JSON.stringify({ label: template.deeplinkLabel })
          : null,
        layout.x,
        layout.y,
        layout.width,
        layout.height,
        index,
        timestamp,
        timestamp,
      );
    });
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

type DashboardRow = {
  id: string;
  owner_user_id: string;
  title: string;
  description: string | null;
  footer_json: string | null;
  is_default: number;
  revision: number;
};

type CardRow = {
  id: string;
  dashboard_id: string;
  library_item_key: string | null;
  name: string;
  visualization: VisualizationType;
  source_query: string;
  deeplink_json: string | null;
  grid_x: number;
  grid_y: number;
  grid_width: number;
  grid_height: number;
  sort_order: number;
};

function mapCard(row: CardRow): PersistedDashboardCard {
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

function parseJson<T>(value: string | null): T | undefined {
  return value ? (JSON.parse(value) as T) : undefined;
}

function firstAvailableLayout(
  cards: PersistedDashboardCard[],
  size: { width: number; height: number },
): DashboardCardLayout {
  for (let y = 0; ; y += 1) {
    for (let x = 0; x + size.width <= 4; x += 1) {
      const candidate = { x, y, ...size };
      if (!cards.some((card) => layoutsOverlap(candidate, card.layout)))
        return candidate;
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
  DashboardInvalidLayoutError,
  DashboardNotFoundError,
  DashboardRevisionConflictError,
  DashboardCardAlreadyAddedError,
  DashboardInvalidLibraryItemError,
  SqliteDashboardRepository,
};
export type {
  DashboardBootstrap,
  DashboardRepository,
  PersistedDashboard,
  PersistedDashboardCard,
};
