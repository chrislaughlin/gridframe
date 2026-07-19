import {
  createDashboardAIProvider,
  createDashboardAIHandlers,
  createDashboardAIService,
} from "@gridframe/server";
import type { DashboardAIProvider } from "@gridframe/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { aiDataFields } from "./ai-data-fields";
import { aiCardLibrary, cardLibrary } from "./card-definitions";
import { getDashboardRepository } from "./service";

const dashboardAIPermissions = ["dashboard:read", "dashboard:write"] as const;
const dashboardAISessionCookie = "gridframe-ai-session";
const dashboardAISessionLifetimeSeconds = 8 * 60 * 60;

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
  const authentication = authenticateDashboardAIRequest(request, userId);
  if (authentication instanceof Response) return authentication;

  return getDashboardAIHandlers()[operation](request, {
    userId,
    principalId: authentication.principalId,
  });
}

function authenticateDashboardAIRequest(request: Request, userId: string) {
  const principalId = process.env.GRIDFRAME_AI_USER_ID;
  const accessToken = process.env.GRIDFRAME_AI_ACCESS_TOKEN;
  if (!principalId || !accessToken) {
    return Response.json(
      {
        error: {
          code: "AI_NOT_CONFIGURED",
          message: "Dashboard AI authentication is not configured",
        },
      },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization");
  const providedToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const bearerAuthenticated = secureTokenEquals(providedToken, accessToken);
  const cookieAuthenticated =
    isSameOriginMutation(request) &&
    verifyDashboardAISession(
      request.headers.get("cookie"),
      principalId,
      accessToken,
    );
  if (
    userId !== principalId ||
    (!bearerAuthenticated && !cookieAuthenticated)
  ) {
    return Response.json(
      {
        error: {
          code: "AI_PERMISSION_DENIED",
          message: "Dashboard AI authentication failed",
        },
      },
      { status: 403 },
    );
  }

  return { principalId };
}

function createDashboardAISession(
  request: Request,
  input: { userId: string; accessToken: string },
) {
  const principalId = process.env.GRIDFRAME_AI_USER_ID;
  const accessToken = process.env.GRIDFRAME_AI_ACCESS_TOKEN;
  if (!principalId || !accessToken) {
    return Response.json(
      {
        error: {
          code: "AI_NOT_CONFIGURED",
          message: "Dashboard AI authentication is not configured",
        },
      },
      { status: 503 },
    );
  }
  if (
    !isSameOriginMutation(request) ||
    input.userId !== principalId ||
    !secureTokenEquals(input.accessToken, accessToken)
  ) {
    return Response.json(
      {
        error: {
          code: "AI_PERMISSION_DENIED",
          message: "Dashboard AI authentication failed",
        },
      },
      { status: 403 },
    );
  }

  const value = signDashboardAISession(principalId, accessToken);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": `${dashboardAISessionCookie}=${value}; HttpOnly; SameSite=Strict; Path=/api/gridframe; Max-Age=28800${secure}`,
    },
  });
}

function signDashboardAISession(userId: string, accessToken: string) {
  const subject = Buffer.from(userId).toString("base64url");
  const expiresAt =
    Math.floor(Date.now() / 1_000) + dashboardAISessionLifetimeSeconds;
  const payload = `${subject}.${expiresAt}`;
  const signature = createHmac("sha256", accessToken)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function verifyDashboardAISession(
  cookieHeader: string | null,
  userId: string,
  accessToken: string,
) {
  const cookie = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${dashboardAISessionCookie}=`));
  const provided = cookie?.slice(dashboardAISessionCookie.length + 1) ?? "";
  const [subject, expiresAtText, signature, ...extra] = provided.split(".");
  const expiresAt = Number(expiresAtText);
  if (
    extra.length > 0 ||
    !subject ||
    !signature ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1_000)
  ) {
    return false;
  }
  const expectedSubject = Buffer.from(userId).toString("base64url");
  const payload = `${subject}.${expiresAt}`;
  const expectedSignature = createHmac("sha256", accessToken)
    .update(payload)
    .digest("base64url");
  return (
    secureTokenEquals(subject, expectedSubject) &&
    secureTokenEquals(signature, expectedSignature)
  );
}

function isSameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}

function secureTokenEquals(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}

export {
  authenticateDashboardAIRequest,
  createDashboardAIProviderFromEnvironment,
  createDashboardAISession,
  getDashboardAIHandlers,
  handleDashboardAIRequest,
};
