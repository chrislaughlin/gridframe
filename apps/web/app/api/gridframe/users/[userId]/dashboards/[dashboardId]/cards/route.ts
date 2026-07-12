import { createAddCardHandler } from "~/server/dashboard/card-library-handler";
import { getDashboardRepository } from "~/server/dashboard/service";

export const runtime = "nodejs";

async function POST(
  request: Request,
  context: { params: Promise<{ userId: string; dashboardId: string }> },
) {
  const { userId, dashboardId } = await context.params;
  return createAddCardHandler(getDashboardRepository())(
    request,
    userId,
    dashboardId,
  );
}

export { POST };
