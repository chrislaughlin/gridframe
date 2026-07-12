import { getDashboardHandlers } from "~/server/dashboard/handlers";

export const runtime = "nodejs";

async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string; dashboardId: string }> },
) {
  const { userId, dashboardId } = await context.params;
  return getDashboardHandlers().updateLayout(request, { userId, dashboardId });
}

export { PATCH };
