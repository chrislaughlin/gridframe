import { getDashboardHandlers } from "~/server/dashboard/handlers";

export const runtime = "nodejs";

async function POST(
  request: Request,
  context: { params: Promise<{ userId: string; dashboardId: string }> },
) {
  const { userId, dashboardId } = await context.params;
  return getDashboardHandlers().addCard(request, { userId, dashboardId });
}

export { POST };
