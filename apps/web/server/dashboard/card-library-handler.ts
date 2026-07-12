import {
  AddDashboardCardRequestSchema,
  RemoveDashboardCardRequestSchema,
} from "@gridframe/core";

import { errorResponse } from "./bootstrap-handler";
import {
  DashboardCardAlreadyAddedError,
  DashboardInvalidLibraryItemError,
  DashboardNotFoundError,
  DashboardRevisionConflictError,
  type DashboardRepository,
} from "./repository";
import { serializeDashboardDocument } from "./serialization";

function createCardLibraryHandler(repository: DashboardRepository) {
  return (_request: Request, userId: string, dashboardId: string) => {
    try {
      return Response.json({
        items: repository.listCardLibrary(userId, dashboardId),
      });
    } catch (error) {
      return libraryError(error);
    }
  };
}

function createAddCardHandler(repository: DashboardRepository) {
  return async (request: Request, userId: string, dashboardId: string) => {
    const parsed = AddDashboardCardRequestSchema.safeParse(
      await readJson(request),
    );
    const revision = parsed.success
      ? parseRevision(parsed.data.revision)
      : undefined;
    if (!parsed.success || revision === undefined || !userId || !dashboardId) {
      return errorResponse(400, "INVALID_REQUEST", "Invalid Card add request");
    }
    try {
      const dashboard = repository.addCard(
        userId,
        dashboardId,
        revision,
        parsed.data.libraryItemKey,
      );
      return Response.json({
        dashboard: serializeDashboardDocument(dashboard),
        cardLibrary: { items: repository.listCardLibrary(userId, dashboardId) },
      });
    } catch (error) {
      return libraryError(error);
    }
  };
}

function createRemoveCardHandler(repository: DashboardRepository) {
  return async (
    request: Request,
    userId: string,
    dashboardId: string,
    cardId: string,
  ) => {
    const parsed = RemoveDashboardCardRequestSchema.safeParse(
      await readJson(request),
    );
    const revision = parsed.success
      ? parseRevision(parsed.data.revision)
      : undefined;
    if (
      !parsed.success ||
      revision === undefined ||
      !userId ||
      !dashboardId ||
      !cardId
    ) {
      return errorResponse(
        400,
        "INVALID_REQUEST",
        "Invalid Card remove request",
      );
    }
    try {
      const dashboard = repository.removeCard(
        userId,
        dashboardId,
        cardId,
        revision,
      );
      return Response.json({
        dashboard: serializeDashboardDocument(dashboard),
        cardLibrary: { items: repository.listCardLibrary(userId, dashboardId) },
      });
    } catch (error) {
      return libraryError(error);
    }
  };
}

function libraryError(error: unknown) {
  if (error instanceof DashboardRevisionConflictError)
    return errorResponse(
      409,
      "REVISION_CONFLICT",
      "Dashboard was changed by another request",
    );
  if (error instanceof DashboardCardAlreadyAddedError)
    return errorResponse(
      409,
      "CARD_ALREADY_ADDED",
      "Card is already on this Dashboard",
    );
  if (error instanceof DashboardInvalidLibraryItemError)
    return errorResponse(400, "INVALID_REQUEST", "Unknown Card library item");
  if (error instanceof DashboardNotFoundError)
    return errorResponse(404, "DASHBOARD_NOT_FOUND", "Dashboard not found");
  return errorResponse(
    500,
    "DASHBOARD_LOAD_FAILED",
    "Dashboard could not be updated",
  );
}

function parseRevision(value: string) {
  if (!/^[1-9]\d*$/.test(value)) return undefined;
  const revision = Number(value);
  return Number.isSafeInteger(revision) ? revision : undefined;
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export {
  createAddCardHandler,
  createCardLibraryHandler,
  createRemoveCardHandler,
};
