import { createBootstrapHandler } from "~/server/dashboard/bootstrap-handler";
import { getDashboardRepository } from "~/server/dashboard/service";

export const runtime = "nodejs";

async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  return createBootstrapHandler(getDashboardRepository())(request, userId);
}

export { POST };
