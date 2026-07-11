import { createConsumerCardHandler } from "~/server/dashboard/consumer-handler";

export const runtime = "nodejs";

async function GET(
  _request: Request,
  context: { params: Promise<{ sourceKey: string }> },
) {
  const { sourceKey } = await context.params;
  return createConsumerCardHandler()(sourceKey);
}

export { GET };
