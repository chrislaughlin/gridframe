import { createLayoutMutationHandler } from "~/server/dashboard/mutation-handler";
import { getDashboardRepository } from "~/server/dashboard/service";

export const runtime = "nodejs";

async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string; dashboardId: string }> },
) {
  const { userId, dashboardId } = await context.params;
  return createLayoutMutationHandler(getDashboardRepository())(
    request,
    userId,
    dashboardId,
  );
}

export { PATCH };
