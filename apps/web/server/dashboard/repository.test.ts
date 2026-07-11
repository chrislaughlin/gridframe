import { afterEach, describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { openDashboardDatabase } from "./database";
import {
  DashboardNotFoundError,
  SqliteDashboardRepository,
} from "./repository";

const databases: ReturnType<typeof openDashboardDatabase>[] = [];
const temporaryDirectories: string[] = [];
const execFileAsync = promisify(execFile);

afterEach(() => {
  for (const database of databases.splice(0)) {
    database.close();
  }
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createRepository() {
  const database = openDashboardDatabase(":memory:");
  databases.push(database);
  return new SqliteDashboardRepository(database);
}

describe("SqliteDashboardRepository.bootstrap", () => {
  it("seeds one default Dashboard with metric, chart, and table Cards", () => {
    const repository = createRepository();

    const result = repository.bootstrap("user-1");

    expect(result.dashboard.ownerUserId).toBe("user-1");
    expect(result.dashboard.isDefault).toBe(true);
    expect(result.dashboard.revision).toBe(1);
    expect(result.dashboard.cards.map((card) => card.visualization)).toEqual([
      "metric",
      "bar",
      "table",
    ]);
    expect(result.dashboards).toEqual([
      {
        id: result.dashboard.id,
        title: result.dashboard.title,
        isDefault: true,
      },
    ]);
  });

  it("returns the same default Dashboard for repeated and concurrent bootstrap", async () => {
    const repository = createRepository();

    const [first, second] = await Promise.all([
      Promise.resolve().then(() => repository.bootstrap("user-1")),
      Promise.resolve().then(() => repository.bootstrap("user-1")),
    ]);

    expect(second.dashboard.id).toBe(first.dashboard.id);
    expect(repository.bootstrap("user-1").dashboard.id).toBe(
      first.dashboard.id,
    );
  });

  it("serializes competing bootstrap processes to one default Dashboard", async () => {
    const directory = mkdtempSync(join(tmpdir(), "gridframe-bootstrap-"));
    temporaryDirectories.push(directory);
    const databasePath = join(directory, "dashboard.sqlite");
    const initializedDatabase = openDashboardDatabase(databasePath);
    initializedDatabase.close();
    const workerPath = join(
      process.cwd(),
      "server/dashboard/bootstrap-worker.ts",
    );
    const startAt = String(Date.now() + 1_000);

    const workers = await Promise.all([
      execFileAsync("tsx", [workerPath, databasePath, startAt], {
        cwd: process.cwd(),
      }),
      execFileAsync("tsx", [workerPath, databasePath, startAt], {
        cwd: process.cwd(),
      }),
    ]);
    const ids = workers.map(({ stdout }) => {
      const line = stdout.trim().split("\n").at(-1);
      return JSON.parse(line ?? "{}") as { id?: string };
    });

    expect(ids[0]?.id).toBeTruthy();
    expect(ids[1]?.id).toBe(ids[0]?.id);

    const database = openDashboardDatabase(databasePath);
    databases.push(database);
    const result = new SqliteDashboardRepository(database).bootstrap(
      "concurrent-user",
    );
    expect(result.dashboards).toHaveLength(1);
    expect(result.dashboard.id).toBe(ids[0]?.id);
  }, 15_000);

  it("does not expose another owner's requested Dashboard", () => {
    const repository = createRepository();
    const owned = repository.bootstrap("user-1").dashboard;

    expect(() => repository.bootstrap("user-2", owned.id)).toThrow(
      DashboardNotFoundError,
    );
  });
});
