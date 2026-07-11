import { join } from "node:path";

import { openDashboardDatabase } from "./database";
import { SqliteDashboardRepository } from "./repository";

let dashboardRepository: SqliteDashboardRepository | undefined;

function getDashboardRepository() {
  if (!dashboardRepository) {
    const filename =
      process.env.GRIDFRAME_DATABASE_PATH ??
      join(process.cwd(), ".data", "gridframe.sqlite");
    dashboardRepository = new SqliteDashboardRepository(
      openDashboardDatabase(filename),
    );
  }

  return dashboardRepository;
}

export { getDashboardRepository };
