import {
  type CardDeeplinkConfig,
  type DashboardFooterConfig,
  type DashboardLayoutItem,
  type DashboardSummary,
  type VisualizationType,
  validateDashboardLayout,
} from "@gridframe/core";
import { randomUUID } from "node:crypto";
import { type Database } from "better-sqlite3";

import { defaultDashboardSeed } from "./seed";

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

interface DashboardRepository {
  bootstrap(ownerUserId: string, dashboardId?: string): DashboardBootstrap;
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
}

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

class SqliteDashboardRepository implements DashboardRepository {
  constructor(private readonly database: Database) {}

  bootstrap(ownerUserId: string, dashboardId?: string): DashboardBootstrap {
    return this.database
      .transaction(() => {
        let defaultDashboard = this.findDefault(ownerUserId);

        if (!defaultDashboard) {
          this.seedDefault(ownerUserId);
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
          dashboard: this.loadDashboard(dashboard),
        };
      })
      .immediate();
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
      const currentCards = this.loadDashboard(dashboard).cards;
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

      return this.loadDashboard(
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

      return this.loadDashboard(
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

  private loadDashboard(row: DashboardRow): PersistedDashboard {
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

  private seedDefault(ownerUserId: string) {
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
        defaultDashboardSeed.title,
        defaultDashboardSeed.description,
        JSON.stringify(defaultDashboardSeed.footer),
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

    defaultDashboardSeed.cards.forEach((card, index) => {
      insertCard.run(
        randomUUID(),
        dashboardId,
        card.key,
        card.name,
        card.visualization,
        card.sourceQuery,
        JSON.stringify({ label: card.deeplinkLabel }),
        card.layout.x,
        card.layout.y,
        card.layout.width,
        card.layout.height,
        index,
        timestamp,
        timestamp,
      );
    });
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

export {
  DashboardInvalidLayoutError,
  DashboardNotFoundError,
  DashboardRevisionConflictError,
  SqliteDashboardRepository,
};
export type {
  DashboardBootstrap,
  DashboardRepository,
  PersistedDashboard,
  PersistedDashboardCard,
};
