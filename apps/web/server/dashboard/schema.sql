CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  footer_json JSONB,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS dashboards_owner_user_id_idx
  ON dashboards(owner_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS one_default_dashboard_per_user
  ON dashboards(owner_user_id)
  WHERE is_default;

CREATE TABLE IF NOT EXISTS dashboard_cards (
  id UUID PRIMARY KEY,
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  library_item_key TEXT,
  name TEXT NOT NULL,
  visualization TEXT NOT NULL,
  source_query TEXT NOT NULL,
  deeplink_json JSONB,
  grid_x INTEGER NOT NULL CHECK (grid_x >= 0),
  grid_y INTEGER NOT NULL CHECK (grid_y >= 0),
  grid_width INTEGER NOT NULL CHECK (grid_width > 0),
  grid_height INTEGER NOT NULL CHECK (grid_height > 0),
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (dashboard_id, library_item_key)
);

CREATE INDEX IF NOT EXISTS dashboard_cards_dashboard_id_idx
  ON dashboard_cards(dashboard_id, sort_order);
