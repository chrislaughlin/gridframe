import { handleDashboardAIRequest } from "~/server/dashboard/ai";

export const runtime = "nodejs";

async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  return handleDashboardAIRequest(request, userId, "applyDashboardProposal");
}

export { POST };
