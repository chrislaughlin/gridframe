import { getDashboardHandlers } from "~/server/dashboard/handlers";

export const runtime = "nodejs";

async function GET(
  request: Request,
  context: {
    params: Promise<{
      userId: string;
      dashboardId: string;
      cardId: string;
    }>;
  },
) {
  const params = await context.params;
  return getDashboardHandlers().fetchCardData(request, params);
}

export { GET };
