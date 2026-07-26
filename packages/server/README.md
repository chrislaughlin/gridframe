# @gridframe/server

Framework-neutral server helpers for API-managed Gridframe Dashboards.

```ts
import { createDashboardHandlers, defineCards } from "@gridframe/server";

const cards = defineCards({
  revenue: {
    name: "Revenue",
    visualization: "metric",
    defaultLayout: { width: 1, height: 2 },
    resolve: async ({ userId }) => ({
      status: "success",
      data: {
        visualization: "metric",
        value: await revenueForUser(userId),
        label: "Revenue",
      },
    }),
  },
});

const handlers = createDashboardHandlers({
  repository,
  cardLibrary: cards.cardLibrary,
  defaultDashboard: ({ userId }) => dashboardSeedFor(userId),
  resolveCardData: cards.resolveCardData,
});
```

The handlers use the standard Fetch `Request`/`Response` APIs, so framework adapters only need to extract route params and pass the request through.

## Next.js route handler

```ts
export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  return handlers.bootstrap(request, { userId });
}
```

## Express route

```ts
app.post(
  "/api/gridframe/users/:userId/dashboards/bootstrap",
  async (req, res) => {
    const request = new Request(
      req.protocol + "://" + req.get("host") + req.originalUrl,
      {
        method: req.method,
        headers: req.headers as HeadersInit,
        body: JSON.stringify(req.body),
      },
    );
    const response = await handlers.bootstrap(request, {
      userId: req.params.userId,
    });
    res
      .status(response.status)
      .set(Object.fromEntries(response.headers))
      .send(await response.text());
  },
);
```

## TanStack Start or Vite-style server

```ts
export async function handle({ request, params }) {
  return handlers.bootstrap(request, { userId: params.userId });
}
```

Host applications own authorization. The `userId` passed to handlers is an application identity key and must not be trusted without the host app checking access.

## Dashboard AI

`createDashboardAIService` adds proposal generation, validation, and transactional application. `createDashboardAIProvider` configures OpenRouter, OpenAI, Anthropic, Google, or a custom OpenAI-compatible endpoint behind one interface. Consumers supply authorization, AI-capable Cards, safe fields, and a `DashboardAIRepository` implementation.

See [AI-generated Dashboards](https://github.com/chrislaughlin/gridframe/blob/main/docs/ai-dashboards.md) for setup, routes, provider configuration, security boundaries, and a complete example.

## Unified configuration

```ts
const gridframe = createGridframe({
  repository,
  cards,
  seed: ({ userId }) => dashboardSeedFor(userId),
});
```

The returned value keeps handlers, Card metadata, and the resolver from the same trusted `defineCards` registry. `createDashboardHandlers` remains the lower-level API.

For Next.js App Router, install `@gridframe/next` and mount this value from a catch-all route with `createNextGridframeRoute`. Its required `resolveIdentity` callback keeps authentication and authorization host-owned.
