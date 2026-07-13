import { openDashboardDatabase } from "./database";
import { NeonDashboardRepository } from "./repository";

let dashboardRepository: NeonDashboardRepository | undefined;

function getDashboardRepository() {
  if (!dashboardRepository) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required to connect to Neon");
    }

    dashboardRepository = new NeonDashboardRepository(
      openDashboardDatabase(connectionString),
    );
  }

  return dashboardRepository;
}

export { getDashboardRepository };
