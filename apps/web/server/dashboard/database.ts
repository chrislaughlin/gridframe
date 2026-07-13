import { neon, neonConfig } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type QueryResult<Row> = {
  rows: Row[];
  rowCount: number;
};

type DashboardDatabase = {
  query<Row extends Record<string, unknown>>(
    text: string,
    parameters?: unknown[],
  ): Promise<QueryResult<Row>>;
};

function openDashboardDatabase(connectionString: string): DashboardDatabase {
  const fetchFunction = globalThis.fetch;
  neonConfig.fetchFunction = (...arguments_: Parameters<typeof fetch>) =>
    fetchFunction(...arguments_);
  const sql = neon(connectionString, {
    fullResults: true,
    disableWarningInBrowsers: true,
  });
  const execute = async <Row extends Record<string, unknown>>(
    text: string,
    parameters: unknown[] = [],
  ) => {
    const result = await sql.query(text, parameters);
    return result as QueryResult<Row>;
  };
  const schema = readFileSync(
    join(process.cwd(), "server/dashboard/schema.sql"),
    "utf8",
  );
  const statements = schema
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  const ready = sql.transaction((transaction) => [
    transaction.query("SELECT pg_advisory_xact_lock($1)", [1_146_495_778]),
    ...statements.map((statement) => transaction.query(statement)),
  ]);

  return {
    async query(text, parameters) {
      await ready;
      return execute(text, parameters);
    },
  };
}

export { openDashboardDatabase };
export type { DashboardDatabase, QueryResult };
