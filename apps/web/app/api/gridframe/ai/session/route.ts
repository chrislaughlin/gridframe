import { createDashboardAISession } from "~/server/dashboard/ai";

export const runtime = "nodejs";

async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("userId" in body) ||
    typeof body.userId !== "string" ||
    !("accessToken" in body) ||
    typeof body.accessToken !== "string"
  ) {
    return Response.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid Dashboard AI session request",
        },
      },
      { status: 400 },
    );
  }

  return createDashboardAISession(request, {
    userId: body.userId,
    accessToken: body.accessToken,
  });
}

export { POST };
