import { createCardLibraryHandler } from "~/server/dashboard/card-library-handler";
import { getDashboardRepository } from "~/server/dashboard/service";

export const runtime = "nodejs";

async function GET(
  request: Request,
  context: { params: Promise<{ userId: string; dashboardId: string }> },
) {
  const { userId, dashboardId } = await context.params;
  return createCardLibraryHandler(getDashboardRepository())(
    request,
    userId,
    dashboardId,
  );
}

export { GET };
