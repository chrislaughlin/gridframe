import { getDashboardHandlers } from "~/server/dashboard/handlers";

export const runtime = "nodejs";

async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  return getDashboardHandlers().bootstrap(request, { userId });
}

export { POST };
