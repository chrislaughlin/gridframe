import { openDashboardDatabase } from "./database";
import { SqliteDashboardRepository } from "./repository";

const [databasePath, startAtValue] = process.argv.slice(2);
if (!databasePath || !startAtValue) {
  throw new Error("Expected database path and synchronized start time");
}

const delay = Math.max(0, Number(startAtValue) - Date.now());
await new Promise((resolve) => setTimeout(resolve, delay));

const database = openDashboardDatabase(databasePath);
try {
  const result = new SqliteDashboardRepository(database).bootstrap(
    "concurrent-user",
  );
  process.stdout.write(`${JSON.stringify({ id: result.dashboard.id })}\n`);
} finally {
  database.close();
}
