CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE dashboards (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  footer_json TEXT,
  is_default INTEGER NOT NULL CHECK (is_default IN (0, 1)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX dashboards_owner_user_id_idx ON dashboards(owner_user_id);

CREATE UNIQUE INDEX one_default_dashboard_per_user
  ON dashboards(owner_user_id)
  WHERE is_default = 1;

CREATE TABLE dashboard_cards (
  id TEXT PRIMARY KEY,
  dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  library_item_key TEXT,
  name TEXT NOT NULL,
  visualization TEXT NOT NULL,
  source_query TEXT NOT NULL,
  deeplink_json TEXT,
  grid_x INTEGER NOT NULL CHECK (grid_x >= 0),
  grid_y INTEGER NOT NULL CHECK (grid_y >= 0),
  grid_width INTEGER NOT NULL CHECK (grid_width > 0),
  grid_height INTEGER NOT NULL CHECK (grid_height > 0),
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (dashboard_id, library_item_key)
);

CREATE INDEX dashboard_cards_dashboard_id_idx
  ON dashboard_cards(dashboard_id, sort_order);
