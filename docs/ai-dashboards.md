# AI-generated Dashboards

Gridframe can turn a natural-language request into a validated Dashboard proposal. The model selects Cards from the consumer's Card library and fields from an explicit safe list. Gridframe validates the proposal, shows a preview, and waits for the user to apply it.

## Architecture

The feature keeps each concern in its existing package:

| Package             | Responsibility                                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `@gridframe/core`   | Proposal, action, field, Card data config, filter, validation, and HTTP schemas                                                   |
| `@gridframe/server` | AI metadata from the Card library, safe field lists, provider transport, validation, authorization, telemetry, and Fetch handlers |
| `@gridframe/client` | Typed propose, validate, and apply requests                                                                                       |
| `@gridframe/react`  | Prompt, proposal summary, validation messages, layout preview, and explicit Apply action                                          |
| Consumer app        | Authentication, permissions, provider key, field access, Dashboard repository, Card data resolvers, and routes                    |

The generation path is:

1. The server authorizes the authenticated principal and loads the current Dashboard, when editing.
2. The consumer supplies the approved AI Card library and AI-safe data fields.
3. The provider returns JSON that matches `DashboardProposalSchema`.
4. Gridframe rejects unknown Cards, fields, aggregations, filters, Card IDs, and invalid layouts.
5. Gridframe makes one repair request for malformed JSON, schema errors, unknown Card keys, or unknown fields.
6. The client receives a preview. Generation does not write to the Dashboard repository.
7. Apply repeats authorization, revision, schema, Card library, field, and layout checks.
8. The consumer repository creates or updates the complete result in one transaction. Updates increment the revision once.

The model cannot send SQL, JavaScript, React components, or arbitrary database commands through the proposal schema. Card data still flows through registered Card data resolvers.

## Install and configure

Install the packages used by your server and React app:

```sh
pnpm add @gridframe/core @gridframe/server @gridframe/client @gridframe/react
```

Create an OpenRouter API key, then set server environment variables:

```env
OPENROUTER_API_KEY=your-server-key
GRIDFRAME_AI_MODEL=openai/gpt-oss-20b

# Bundled example host authentication (not provider credentials)
GRIDFRAME_AI_USER_ID=demo-user
GRIDFRAME_AI_ACCESS_TOKEN=choose-a-long-random-value
```

`GRIDFRAME_AI_MODEL` is optional. `openai/gpt-oss-20b` is the default. Keep both variables out of browser-prefixed environment files and client bundles.

## Register AI-capable Cards

Add `ai` metadata to an existing `defineCards` entry. Gridframe derives `aiCardLibrary` from the same registry that supplies the Card library and data resolver.

```ts
import { defineCards } from "@gridframe/server";

export const cards = defineCards({
  "total-revenue": {
    name: "Total revenue",
    description: "Recognised order revenue.",
    visualization: "metric",
    defaultLayout: { width: 1, height: 2 },
    ai: {
      tags: ["sales", "revenue", "kpi"],
      questionsAnswered: ["What is total revenue?"],
      requiredDataShape: {
        minMetrics: 1,
        maxMetrics: 1,
        minDimensions: 0,
        maxDimensions: 0,
        supportsTimeSeries: false,
      },
      supportedFilters: ["equals", "in", "between"],
    },
    resolve: async ({ card, userId }) => {
      const result = await loadRevenue({
        userId,
        data: card.data,
      });
      return {
        status: "success",
        data: {
          visualization: "metric",
          value: result.total,
          label: "Revenue",
        },
      };
    },
  },
});
```

Cards without `ai` metadata stay in the normal Card library and never enter the model prompt. Gridframe rejects AI metadata on unsupported Visualizations.

## Expose safe data fields

Register semantic field metadata instead of database columns or direct database access:

```ts
import { defineAIDataFields } from "@gridframe/server";

export const fields = defineAIDataFields([
  {
    key: "revenue",
    label: "Revenue",
    type: "number",
    role: "metric",
    allowedAggregations: ["sum", "average"],
    filterable: true,
    sortable: true,
  },
  {
    key: "region",
    label: "Region",
    type: "category",
    role: "dimension",
    filterable: true,
    sortable: true,
  },
  {
    key: "customer_email",
    label: "Customer email",
    type: "string",
    sensitive: true,
  },
]);
```

`defineAIDataFields` removes fields marked `sensitive`. Use a field-list callback when access changes by user, tenant, data source, or permission.

## Configure the service

Your Dashboard repository must implement `DashboardAIRepository`. `createDashboardFromProposal` receives a validated new Dashboard, while `applyDashboardProposal` receives a validated replacement state and expected revision. Save metadata, global filters, Cards, Card data config, and layout in one transaction.

```ts
import {
  DEFAULT_OPENROUTER_MODEL,
  OpenRouterDashboardAIProvider,
  createDashboardAIHandlers,
  createDashboardAIService,
} from "@gridframe/server";
import { cards } from "./cards";
import { fields } from "./fields";

const provider = new OpenRouterDashboardAIProvider({
  apiKey: process.env.OPENROUTER_API_KEY!,
  model: process.env.GRIDFRAME_AI_MODEL ?? DEFAULT_OPENROUTER_MODEL,
  appName: "Acme analytics",
});

const service = createDashboardAIService({
  repository,
  provider,
  aiCardLibrary: async ({ userId }) =>
    filterCardsForUser(cards.aiCardLibrary, userId),
  cardLibrary: cards.cardLibrary,
  dataCatalogue: async ({ userId, dataSourceId }) =>
    fieldsForUser(userId, dataSourceId, fields),
  permissions: async ({ principalId }) => permissionsFor(principalId),
  authorize: ({ principalId, userId, dashboardId }, operation) =>
    principalId === userId &&
    canUseDashboardAI(principalId, dashboardId, operation),
  telemetry: (event) => telemetry.track(event.type, event),
});

export const aiHandlers = createDashboardAIHandlers({ service });
```

Mount these Fetch-native handlers:

| Method | Route                                            | Handler                     |
| ------ | ------------------------------------------------ | --------------------------- |
| `POST` | `/users/:userId/ai/dashboard-proposals`          | `proposeDashboard`          |
| `POST` | `/users/:userId/ai/dashboard-proposals/validate` | `validateDashboardProposal` |
| `POST` | `/users/:userId/ai/dashboard-proposals/apply`    | `applyDashboardProposal`    |

A Next.js route adapter authenticates the request before it constructs the handler context. Never copy the path `userId` into `principalId` without verifying it against the host session:

```ts
export async function POST(request: Request, context: RouteContext) {
  const { userId } = await context.params;
  const session = await requireSession(request);
  if (session.user.id !== userId) return new Response(null, { status: 403 });
  return aiHandlers.proposeDashboard(request, {
    userId,
    principalId: session.user.id,
  });
}
```

The bundled Next.js example fails closed unless `GRIDFRAME_AI_USER_ID` and `GRIDFRAME_AI_ACCESS_TOKEN` are configured. Its small example sign-in form exchanges that host credential for a signed, `HttpOnly`, `SameSite=Strict` cookie; the credential and provider key are not stored in browser code. The AI routes also accept `Authorization: Bearer <token>` for server-to-server examples. Production applications should replace this demonstration boundary with their existing server session.

## Generate, preview, and apply

The client exposes named functions and an `ai` namespace:

```ts
import { ai } from "@gridframe/client";

const preview = await ai.proposeDashboard({
  userId: "user-1",
  dashboardId: dashboard.id,
  revision: dashboard.revision,
  dataSourceId: "orders",
  prompt: "Add revenue and order KPIs above a monthly revenue trend.",
});

if (preview.validation.canApply && preview.dashboardId && preview.revision) {
  const updated = await ai.applyDashboardProposal({
    userId: "user-1",
    dashboardId: preview.dashboardId,
    revision: preview.revision,
    proposal: preview.proposal,
  });
}
```

Omit `dashboardId` and `revision` to propose a new named Dashboard. Generation remains read-only; the proposal must include `createDashboard`, and the Dashboard record is created transactionally only when the client calls Apply. `RequestOptions` also accepts `headers` and `credentials` for a host application's authentication scheme; these options are HTTP metadata and never enter the JSON proposal payload.

`<PanelDashboard dashboard={{ userId }} />` includes the same flow in its **Create with AI** dialog. The user can edit the current Dashboard or create a new named Dashboard. It shows assumptions, missing information, validation errors, action labels, and the server-resolved final Card layout. The component sends Apply only after the user selects **Apply proposal**.

An `addGlobalFilter` action may omit `value`. The Dashboard then renders a user input for the unbound filter; setting or clearing it uses the normal Dashboard revision mechanism, and the value reaches Card data resolvers through `globalFilters`.

## Run the bundled example

The repository's `apps/web` application wires the real OpenRouter provider, Neon Dashboard repository, authenticated routes, React dialog, ecommerce Card library, safe fields, and data-config-aware resolvers together.

1. Complete the existing `DATABASE_URL` and schema setup described in the root README.
2. Set the four environment values shown above in `apps/web/.env.local`.
3. Run `pnpm --filter web dev` and open `/gridframe/users/demo-user/dashboards`.
4. Enter `GRIDFRAME_AI_ACCESS_TOKEN` in the example sign-in form, then open **Create with AI**.
5. Choose **Create new Dashboard**, enter the ecommerce-manager scenario, review the exact layout, and select **Apply proposal**.

The generated Cards use their persisted data config. The example resolver honours the 12-month range, count/average/sum aggregation, dimensions, filters, sort, top-10 limit, recent-record limit, and the selected global region filter.

## Custom providers

Implement `DashboardAIProvider` to connect OpenAI, Anthropic, Google, or an OpenAI-compatible endpoint:

```ts
import type { DashboardAIProvider } from "@gridframe/server";

export const provider: DashboardAIProvider = {
  model: "company/dashboard-planner",
  async generate({ systemPrompt, userPrompt, jsonSchema }) {
    const result = await companyModel.generate({
      systemPrompt,
      userPrompt,
      jsonSchema,
    });
    return {
      content: result.jsonText,
      model: result.model,
      inputTokens: result.usage?.input,
      outputTokens: result.usage?.output,
      cost: result.usage?.cost,
    };
  },
};
```

Return the JSON object as a string in `content`. Gridframe owns parsing, validation, repair policy, and application.

## Security boundaries

- Keep provider keys in server configuration. Client request schemas contain no provider settings.
- Authenticate the host route, bind `principalId` to the session (not the URL), then use the service `authorize` callback for propose, validate, and apply.
- Return current permission grants from `permissions`. Cards whose `requiredPermissions` are not satisfied are removed from the model prompt and rejected again during validation and Apply.
- Filter the AI Card library and safe field list before prompt construction. Mark sensitive fields or remove them in the field-list callback.
- Treat proposal IDs and references as untrusted. Gridframe rejects IDs on new Cards and resolves all Card keys and fields against those approved capabilities.
- Keep Card data access inside Card data resolvers. Do not execute text returned by the model.
- Implement `createDashboardFromProposal` and `applyDashboardProposal` as single transactions. Updates must be revision checked. The service revalidates before either call.
- Telemetry events contain model, duration, token counts, cost, validation counts, and application status. They omit prompts, API keys, field values, and raw provider responses.

## Current limitations

- OpenRouter is the only bundled provider transport.
- Generation uses request and response rather than streaming progress events.
- New Dashboard proposals are supported, but deleting whole Dashboards is outside the proposal action set.
- Global filters persist and have a user-editable string value in the first UI. The bundled ecommerce resolver applies them; consumers that need enumerated, date, or multi-select controls can provide richer filter UI over the same repository operation.
- Gridframe validates semantic Card data config, but each consumer resolver decides how to translate approved fields, aggregations, filters, time ranges, sort, and limits into its data system.
- Repair covers malformed JSON, schema errors, unknown Cards, and unknown fields. Other validation failures return to the preview for user review.
