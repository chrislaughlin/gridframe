import { createDashboardHandlers } from "@gridframe/server";

import { cardLibrary, resolveExampleCardData } from "./card-definitions";
import { defaultDashboardSeed } from "./seed";
import { getDashboardRepository } from "./service";

function getDashboardHandlers() {
  return createDashboardHandlers({
    repository: getDashboardRepository(),
    cardLibrary,
    defaultDashboard: () => defaultDashboardSeed,
    resolveCardData: resolveExampleCardData,
  });
}

export { getDashboardHandlers };
