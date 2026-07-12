import { getDashboardHandlers } from "~/server/dashboard/handlers";

export const runtime = "nodejs";

async function GET(
  request: Request,
  context: { params: Promise<{ userId: string; dashboardId: string }> },
) {
  const { userId, dashboardId } = await context.params;
  return getDashboardHandlers().listCardLibrary(request, {
    userId,
    dashboardId,
  });
}

export { GET };
