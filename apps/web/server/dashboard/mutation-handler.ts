import {
  UpdateDashboardCardRequestSchema,
  UpdateDashboardLayoutRequestSchema,
} from "@gridframe/core";

import { errorResponse } from "./bootstrap-handler";
import {
  DashboardInvalidLayoutError,
  DashboardNotFoundError,
  DashboardRevisionConflictError,
  type DashboardRepository,
} from "./repository";
import { serializeDashboardDocument } from "./serialization";

function createLayoutMutationHandler(repository: DashboardRepository) {
  return async function updateLayout(
    request: Request,
    ownerUserId: string,
    dashboardId: string,
  ) {
    const parsed = UpdateDashboardLayoutRequestSchema.safeParse(
      await readJson(request),
    );
    const revision = parsed.success
      ? parseRevision(parsed.data.revision)
      : undefined;

    if (
      !parsed.success ||
      revision === undefined ||
      !ownerUserId ||
      !dashboardId
    ) {
      return errorResponse(
        400,
        "INVALID_REQUEST",
        "Invalid Dashboard layout request",
      );
    }

    try {
      return Response.json(
        serializeDashboardDocument(
          repository.updateLayout(
            ownerUserId,
            dashboardId,
            revision,
            parsed.data.cards,
          ),
        ),
      );
    } catch (error) {
      return mutationError(error, "Invalid Dashboard layout");
    }
  };
}

function createCardMutationHandler(repository: DashboardRepository) {
  return async function updateCard(
    request: Request,
    ownerUserId: string,
    dashboardId: string,
    cardId: string,
  ) {
    const parsed = UpdateDashboardCardRequestSchema.safeParse(
      await readJson(request),
    );
    const revision = parsed.success
      ? parseRevision(parsed.data.revision)
      : undefined;
    const name = parsed.success ? parsed.data.name.trim() : "";

    if (
      !parsed.success ||
      revision === undefined ||
      !name ||
      !ownerUserId ||
      !dashboardId ||
      !cardId
    ) {
      return errorResponse(
        400,
        "INVALID_REQUEST",
        "Invalid Card update request",
      );
    }

    try {
      return Response.json(
        serializeDashboardDocument(
          repository.updateCardName(
            ownerUserId,
            dashboardId,
            cardId,
            revision,
            name,
          ),
        ),
      );
    } catch (error) {
      return mutationError(error, "Invalid Card update request");
    }
  };
}

function mutationError(error: unknown, invalidMessage: string) {
  if (error instanceof DashboardRevisionConflictError) {
    return errorResponse(
      409,
      "REVISION_CONFLICT",
      "Dashboard was changed by another request",
    );
  }
  if (error instanceof DashboardNotFoundError) {
    return errorResponse(404, "DASHBOARD_NOT_FOUND", "Dashboard not found");
  }
  if (error instanceof DashboardInvalidLayoutError) {
    return errorResponse(400, "INVALID_REQUEST", invalidMessage);
  }
  return errorResponse(
    500,
    "DASHBOARD_LOAD_FAILED",
    "Dashboard could not be updated",
  );
}

function parseRevision(revision: string) {
  if (!/^[1-9]\d*$/.test(revision)) return undefined;
  const value = Number(revision);
  return Number.isSafeInteger(value) ? value : undefined;
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export { createCardMutationHandler, createLayoutMutationHandler };
