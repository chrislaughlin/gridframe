import type { createGridframe } from "@gridframe/server";

type GridframeServer = ReturnType<typeof createGridframe>;
type Identity = { userId: string };
type NextRouteOptions = {
  resolveIdentity(request: Request): Identity | undefined | Promise<Identity | undefined>;
  authorize?: (input: Identity & { request: Request; dashboardId?: string }) => boolean | Promise<boolean>;
  onRoutingError?: (error: unknown, request: Request) => void;
};
type Context = { params: Promise<{ gridframe?: string[] }> };

/** Mounts every Fetch-native Dashboard handler behind one Next.js App Router catch-all route. */
export function createNextGridframeRoute(gridframe: GridframeServer, options: NextRouteOptions) {
  async function route(request: Request, context: Context): Promise<Response> {
    try {
      const identity = await options.resolveIdentity(request);
      if (!identity) return Response.json({ error: { code: "FEATURE_NOT_AVAILABLE", message: "Not found" } }, { status: 404 });
      const parts = (await context.params).gridframe ?? [];
      const dashboards = parts[0] === "dashboards" ? parts.slice(1) : parts;
      const dashboardId = dashboards[0];
      if (options.authorize && !(await options.authorize({ ...identity, request, dashboardId }))) return new Response("Not found", { status: 404 });
      const handlers = gridframe.handlers;
      if (request.method === "POST" && dashboards[0] === "bootstrap") return handlers.bootstrap(request, identity);
      if (!dashboardId) return new Response("Not found", { status: 404 });
      const dashboardIdentity = { ...identity, dashboardId };
      if (request.method === "PATCH" && dashboards[1] === "layout") return handlers.updateLayout(request, dashboardIdentity);
      if (request.method === "GET" && dashboards[1] === "card-library") return handlers.listCardLibrary(request, dashboardIdentity);
      if (request.method === "POST" && dashboards[1] === "cards") return handlers.addCard(request, dashboardIdentity);
      const cardId = dashboards[2];
      if (dashboards[1] === "cards" && cardId) {
        const cardIdentity = { ...dashboardIdentity, cardId };
        if (request.method === "GET" && dashboards[3] === "data") return handlers.fetchCardData(request, cardIdentity);
        if (request.method === "PATCH" && dashboards.length === 3) return handlers.updateCard(request, cardIdentity);
        if (request.method === "DELETE" && dashboards.length === 3) return handlers.removeCard(request, cardIdentity);
      }
      return new Response(request.method === "GET" ? "Not found" : "Method not allowed", { status: request.method === "GET" ? 404 : 405 });
    } catch (error) {
      options.onRoutingError?.(error, request);
      return Response.json({ error: { code: "DASHBOARD_LOAD_FAILED", message: "Gridframe route failed" } }, { status: 500 });
    }
  }
  return { GET: route, POST: route, PATCH: route, DELETE: route };
}

export type { NextRouteOptions };
