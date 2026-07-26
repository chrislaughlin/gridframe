import {
  createDashboardAIProvider,
  createDashboardAIHandlers,
  createDashboardAIService,
} from "@gridframe/server";
import type { DashboardAIProvider } from "@gridframe/server";

import { aiDataFields } from "./ai-data-fields";
import { aiCardLibrary, cardLibrary } from "./card-definitions";
import { getDashboardRepository } from "./service";

const dashboardAIPermissions = ["dashboard:read", "dashboard:write"] as const;
const publicDashboardExampleUserId = "example-user";

let dashboardAIHandlers:
  | ReturnType<typeof createDashboardAIHandlers>
  | undefined;

function getDashboardAIHandlers() {
  if (dashboardAIHandlers) return dashboardAIHandlers;

  const provider = createDashboardAIProviderFromEnvironment(process.env);
  if (!provider) {
    const unavailable = async () =>
      Response.json(
        {
          error: {
            code: "AI_NOT_CONFIGURED",
            message: "Dashboard AI is not configured",
          },
        },
        { status: 503 },
      );
    dashboardAIHandlers = {
      proposeDashboard: unavailable,
      validateDashboardProposal: unavailable,
      applyDashboardProposal: unavailable,
    };
    return dashboardAIHandlers;
  }

  const service = createDashboardAIService({
    repository: getDashboardRepository(),
    provider,
    aiCardLibrary: aiCardLibrary,
    cardLibrary,
    dataCatalogue: aiDataFields,
    permissions: dashboardAIPermissions,
    authorize: ({ userId, principalId }, operation) =>
      principalId === userId &&
      dashboardAIPermissions.includes(
        operation === "apply" ? "dashboard:write" : "dashboard:read",
      ),
  });
  dashboardAIHandlers = createDashboardAIHandlers({ service });
  return dashboardAIHandlers;
}

function createDashboardAIProviderFromEnvironment(
  environment: Record<string, string | undefined>,
): DashboardAIProvider | undefined {
  const provider = environment.GRIDFRAME_AI_PROVIDER ?? "openrouter";
  const model = environment.GRIDFRAME_AI_MODEL;
  const baseUrl = environment.GRIDFRAME_AI_BASE_URL;
  const genericApiKey = environment.GRIDFRAME_AI_API_KEY;

  switch (provider) {
    case "openrouter": {
      const apiKey = environment.OPENROUTER_API_KEY ?? genericApiKey;
      return apiKey
        ? createDashboardAIProvider({
            provider,
            apiKey,
            ...(model ? { model } : {}),
            ...(baseUrl ? { baseUrl } : {}),
            appName: "Gridframe",
          })
        : undefined;
    }
    case "openai": {
      const apiKey = environment.OPENAI_API_KEY ?? genericApiKey;
      return apiKey
        ? createDashboardAIProvider({
            provider,
            apiKey,
            ...(model ? { model } : {}),
            ...(baseUrl ? { baseUrl } : {}),
          })
        : undefined;
    }
    case "anthropic": {
      const apiKey = environment.ANTHROPIC_API_KEY ?? genericApiKey;
      return apiKey
        ? createDashboardAIProvider({
            provider,
            apiKey,
            ...(model ? { model } : {}),
            ...(baseUrl ? { baseUrl } : {}),
          })
        : undefined;
    }
    case "google": {
      const apiKey =
        environment.GEMINI_API_KEY ??
        environment.GOOGLE_AI_API_KEY ??
        genericApiKey;
      return apiKey
        ? createDashboardAIProvider({
            provider,
            apiKey,
            ...(model ? { model } : {}),
            ...(baseUrl ? { baseUrl } : {}),
          })
        : undefined;
    }
    case "openai-compatible":
      return baseUrl && model
        ? createDashboardAIProvider({
            provider,
            baseUrl,
            model,
            ...(genericApiKey ? { apiKey: genericApiKey } : {}),
          })
        : undefined;
    default:
      return undefined;
  }
}

type DashboardAIOperation =
  | "proposeDashboard"
  | "validateDashboardProposal"
  | "applyDashboardProposal";

async function handleDashboardAIRequest(
  request: Request,
  userId: string,
  operation: DashboardAIOperation,
) {
  const authorization = authorizePublicDashboardExampleRequest(request, userId);
  if (authorization instanceof Response) return authorization;

  return getDashboardAIHandlers()[operation](request, {
    userId,
    principalId: authorization.principalId,
  });
}

function authorizePublicDashboardExampleRequest(
  request: Request,
  userId: string,
) {
  const origin = request.headers.get("origin");
  if (
    userId !== publicDashboardExampleUserId ||
    origin === null ||
    origin !== new URL(request.url).origin
  ) {
    return Response.json(
      {
        error: {
          code: "AI_PERMISSION_DENIED",
          message: "Dashboard example access denied",
        },
      },
      { status: 403 },
    );
  }

  return { principalId: publicDashboardExampleUserId };
}

export {
  authorizePublicDashboardExampleRequest,
  createDashboardAIProviderFromEnvironment,
  getDashboardAIHandlers,
  handleDashboardAIRequest,
};
