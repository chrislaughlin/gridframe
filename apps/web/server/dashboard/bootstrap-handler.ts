import {
  DashboardBootstrapRequestSchema,
  type DashboardApiError,
} from "@gridframe/core";

import { DashboardNotFoundError, type DashboardRepository } from "./repository";
import { serializeDashboardBootstrap } from "./serialization";

function createBootstrapHandler(repository: DashboardRepository) {
  return async function bootstrapDashboard(
    request: Request,
    ownerUserId: string,
  ): Promise<Response> {
    const body = await readJson(request);
    const parsedRequest = DashboardBootstrapRequestSchema.safeParse(body);

    if (!parsedRequest.success || !ownerUserId) {
      return errorResponse(400, "INVALID_REQUEST", "Invalid bootstrap request");
    }

    try {
      const result = repository.bootstrap(
        ownerUserId,
        parsedRequest.data.dashboardId,
      );

      return Response.json(serializeDashboardBootstrap(result));
    } catch (error) {
      if (error instanceof DashboardNotFoundError) {
        return errorResponse(404, "DASHBOARD_NOT_FOUND", "Dashboard not found");
      }

      return errorResponse(
        500,
        "DASHBOARD_LOAD_FAILED",
        "Dashboard could not be loaded",
      );
    }
  };
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

function errorResponse(
  status: number,
  code: DashboardApiError["error"]["code"],
  message: string,
) {
  return Response.json(
    { error: { code, message } } satisfies DashboardApiError,
    {
      status,
    },
  );
}

export { createBootstrapHandler, errorResponse };
