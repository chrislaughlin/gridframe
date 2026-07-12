import { createCardMutationHandler } from "~/server/dashboard/mutation-handler";
import { getDashboardRepository } from "~/server/dashboard/service";
import { createRemoveCardHandler } from "~/server/dashboard/card-library-handler";

export const runtime = "nodejs";

async function PATCH(
  request: Request,
  context: {
    params: Promise<{ userId: string; dashboardId: string; cardId: string }>;
  },
) {
  const { userId, dashboardId, cardId } = await context.params;
  return createCardMutationHandler(getDashboardRepository())(
    request,
    userId,
    dashboardId,
    cardId,
  );
}

export { PATCH };

async function DELETE(
  request: Request,
  context: {
    params: Promise<{ userId: string; dashboardId: string; cardId: string }>;
  },
) {
  const { userId, dashboardId, cardId } = await context.params;
  return createRemoveCardHandler(getDashboardRepository())(
    request,
    userId,
    dashboardId,
    cardId,
  );
}

export { DELETE };
