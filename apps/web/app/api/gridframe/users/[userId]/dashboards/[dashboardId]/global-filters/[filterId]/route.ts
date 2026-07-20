import { getDashboardHandlers } from "~/server/dashboard/handlers";
import { authorizePublicDashboardExampleRequest } from "~/server/dashboard/ai";

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
  const authorization = authorizePublicDashboardExampleRequest(
    request,
    identity.userId,
  );
  if (authorization instanceof Response) return authorization;
  return getDashboardHandlers().updateGlobalFilter(request, identity);
}

export { PATCH };
