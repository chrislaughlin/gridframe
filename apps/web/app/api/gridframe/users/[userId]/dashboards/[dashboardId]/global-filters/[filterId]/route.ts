import { getDashboardHandlers } from "~/server/dashboard/handlers";
import { authenticateDashboardAIRequest } from "~/server/dashboard/ai";

export const runtime = "nodejs";

async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      userId: string;
      dashboardId: string;
      filterId: string;
    }>;
  },
) {
  const identity = await context.params;
  const authentication = authenticateDashboardAIRequest(
    request,
    identity.userId,
  );
  if (authentication instanceof Response) return authentication;
  return getDashboardHandlers().updateGlobalFilter(request, identity);
}

export { PATCH };
