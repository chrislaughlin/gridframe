import { getDashboardHandlers } from "~/server/dashboard/handlers";

export const runtime = "nodejs";

async function PATCH(
  request: Request,
  context: {
    params: Promise<{ userId: string; dashboardId: string; cardId: string }>;
  },
) {
  const { userId, dashboardId, cardId } = await context.params;
  return getDashboardHandlers().updateCard(request, {
    userId,
    dashboardId,
    cardId,
  });
}

export { PATCH };

async function DELETE(
  request: Request,
  context: {
    params: Promise<{ userId: string; dashboardId: string; cardId: string }>;
  },
) {
  const { userId, dashboardId, cardId } = await context.params;
  return getDashboardHandlers().removeCard(request, {
    userId,
    dashboardId,
    cardId,
  });
}

export { DELETE };
