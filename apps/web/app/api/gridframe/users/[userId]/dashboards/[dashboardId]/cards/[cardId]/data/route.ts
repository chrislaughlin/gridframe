import { createCardDataHandler } from "~/server/dashboard/card-data-handler";
import { getDashboardRepository } from "~/server/dashboard/service";

export const runtime = "nodejs";

const handler = createCardDataHandler(
  getDashboardRepository(),
  fetch,
  process.env.GRIDFRAME_CONSUMER_API_BASE_URL ??
    "http://localhost:3000/api/consumer/",
);

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
  return handler(request, params);
}

export { GET };
