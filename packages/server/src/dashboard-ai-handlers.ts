import {
  ApplyDashboardProposalRequestSchema,
  CreateDashboardProposalRequestSchema,
  DashboardApiErrorSchema,
  DashboardProposalValidationResultSchema,
  ValidateDashboardProposalRequestSchema,
  type DashboardApiError,
} from "@gridframe/core";

import {
  DashboardAIError,
  type DashboardAIService,
} from "./dashboard-ai-service";
import { serializeDashboardDocument, type DashboardUrlOptions } from "./index";

type DashboardAIHandlerOptions = {
  service: DashboardAIService;
  urls?: DashboardUrlOptions;
};

type DashboardAIHandlerContext = { userId: string; principalId: string };

function createDashboardAIHandlers(options: DashboardAIHandlerOptions) {
  const urls = {
    apiBasePath: options.urls?.apiBasePath ?? "/api/gridframe",
    dashboardBasePath: options.urls?.dashboardBasePath ?? "/gridframe",
  };

  return {
    proposeDashboard: async (
      request: Request,
      context: DashboardAIHandlerContext,
    ) => {
      const parsed = CreateDashboardProposalRequestSchema.safeParse(
        await readJson(request),
      );
      if (!parsed.success || !validUserId(context.userId)) {
        return errorResponse(
          400,
          "INVALID_REQUEST",
          "Invalid Dashboard proposal request",
        );
      }
      try {
        return Response.json(
          await options.service.proposeDashboard({
            userId: context.userId,
            principalId: context.principalId,
            ...parsed.data,
          }),
        );
      } catch (error) {
        return dashboardAIErrorResponse(error);
      }
    },

    validateDashboardProposal: async (
      request: Request,
      context: DashboardAIHandlerContext,
    ) => {
      const parsed = ValidateDashboardProposalRequestSchema.safeParse(
        await readJson(request),
      );
      if (!parsed.success || !validUserId(context.userId)) {
        return errorResponse(
          400,
          "INVALID_REQUEST",
          "Invalid Dashboard proposal validation request",
        );
      }
      try {
        return Response.json(
          DashboardProposalValidationResultSchema.parse(
            await options.service.validateProposal({
              userId: context.userId,
              principalId: context.principalId,
              ...parsed.data,
            }),
          ),
        );
      } catch (error) {
        return dashboardAIErrorResponse(error);
      }
    },

    applyDashboardProposal: async (
      request: Request,
      context: DashboardAIHandlerContext,
    ) => {
      const parsed = ApplyDashboardProposalRequestSchema.safeParse(
        await readJson(request),
      );
      if (!parsed.success || !validUserId(context.userId)) {
        return errorResponse(
          400,
          "INVALID_REQUEST",
          "Invalid Dashboard proposal apply request",
        );
      }
      try {
        const dashboard = await options.service.applyProposal({
          userId: context.userId,
          principalId: context.principalId,
          ...parsed.data,
        });
        return Response.json(serializeDashboardDocument(dashboard, urls));
      } catch (error) {
        return dashboardAIErrorResponse(error);
      }
    },
  };
}

function dashboardAIErrorResponse(error: unknown) {
  if (error instanceof DashboardAIError) {
    const statuses = {
      AI_PERMISSION_DENIED: 403,
      AI_PROPOSAL_INVALID: 422,
      AI_PROPOSAL_NOT_APPLICABLE: 422,
      REVISION_CONFLICT: 409,
    } as const;
    return errorResponse(statuses[error.code], error.code, error.message);
  }
  if (
    error instanceof Error &&
    error.name === "DashboardRevisionConflictError"
  ) {
    return errorResponse(
      409,
      "REVISION_CONFLICT",
      "Dashboard was changed by another request",
    );
  }
  if (error instanceof Error && error.name === "DashboardNotFoundError") {
    return errorResponse(404, "DASHBOARD_NOT_FOUND", "Dashboard not found");
  }
  return errorResponse(
    502,
    "AI_PROVIDER_FAILED",
    "Dashboard AI could not complete the request",
  );
}

function errorResponse(
  status: number,
  code: DashboardApiError["error"]["code"],
  message: string,
) {
  return Response.json(
    DashboardApiErrorSchema.parse({ error: { code, message } }),
    { status },
  );
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

function validUserId(value: string) {
  return value.trim().length > 0 && value.length <= 256;
}

export { createDashboardAIHandlers };
export type { DashboardAIHandlerContext, DashboardAIHandlerOptions };
