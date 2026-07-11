import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const migrations = [
  {
    version: 1,
    sql: readFileSync(
      join(process.cwd(), "server/dashboard/migrations/0001-initial.sql"),
      "utf8",
    ),
  },
] as const;

function openDashboardDatabase(filename: string): Database.Database {
  if (filename !== ":memory:") {
    mkdirSync(dirname(filename), { recursive: true });
  }

  const database = new Database(filename);
  database.pragma("busy_timeout = 5000");
  database.pragma("foreign_keys = ON");

  if (filename !== ":memory:") {
    database.pragma("journal_mode = WAL");
  }

  migrate(database);
  return database;
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const hasMigration = database.prepare(
    "SELECT 1 FROM schema_migrations WHERE version = ?",
  );
  const recordMigration = database.prepare(
    "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
  );

  for (const migration of migrations) {
    if (hasMigration.get(migration.version)) {
      continue;
    }

    database.transaction(() => {
      database.exec(migration.sql);
      recordMigration.run(migration.version, new Date().toISOString());
    })();
  }
}

export { openDashboardDatabase };
