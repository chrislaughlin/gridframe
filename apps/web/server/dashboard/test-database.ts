import { config } from "dotenv";
import { join } from "node:path";

import { openDashboardDatabase } from "./database";
import { NeonDashboardRepository } from "./repository";

config({
  path: join(process.cwd(), "../..", ".env.development.local"),
  quiet: true,
});

const connectionString = process.env.TEST_DATABASE_URL;
const hasTestDatabase = Boolean(
  connectionString && connectionString !== process.env.DATABASE_URL,
);
const testDatabase = hasTestDatabase
  ? openDashboardDatabase(connectionString!)
  : undefined;

function requireTestDatabase() {
  if (!testDatabase) {
    throw new Error(
      "TEST_DATABASE_URL must be set to a database other than DATABASE_URL",
    );
  }
  return testDatabase;
}

function createTestRepository() {
  return new NeonDashboardRepository(requireTestDatabase());
}

async function deleteTestDashboards(ownerUserIds: string[]) {
  if (!testDatabase) return;
  await testDatabase.query(
    "DELETE FROM dashboards WHERE owner_user_id = ANY($1::text[])",
    [ownerUserIds],
  );
}

export { createTestRepository, deleteTestDashboards, hasTestDatabase };
