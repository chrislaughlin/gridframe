"use client";

import * as React from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  DashboardClientError,
  bootstrapDashboard,
  fetchDashboardCardData,
} from "@gridframe/client";
import { CardVisualization, SourceDataTable } from "./card-visualization";

function DashboardDrillDown(props: {
  userId: string;
  dashboardId: string;
  cardId: string;
}) {
  const [client] = React.useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <DashboardDrillDownContent {...props} />
    </QueryClientProvider>
  );
}

function DashboardDrillDownContent({
  userId,
  dashboardId,
  cardId,
}: {
  userId: string;
  dashboardId: string;
  cardId: string;
}) {
  const query = useQuery({
    queryKey: ["gridframe-drill-down", userId, dashboardId, cardId],
    queryFn: async ({ signal }) => {
      const [bootstrap, data] = await Promise.all([
        bootstrapDashboard({ userId, dashboardId, signal }),
        fetchDashboardCardData({
          userId,
          dashboardId,
          cardId,
          includeSource: true,
          signal,
        }),
      ]);
      const card = bootstrap.dashboard.config.cards.find(
        (candidate) => candidate.id === cardId,
      );
      if (!card)
        throw new DashboardClientError({
          status: 404,
          code: "DASHBOARD_CARD_NOT_FOUND",
          message: "Dashboard Card not found",
        });
      return { bootstrap, card, data };
    },
  });
  const back = `/gridframe/users/${encodeURIComponent(userId)}/dashboards/${encodeURIComponent(dashboardId)}`;
  if (query.isPending)
    return (
      <main className="mx-auto max-w-7xl p-8">
        <p>Loading Card details...</p>
      </main>
    );
  if (query.isError) {
    const missing =
      query.error instanceof DashboardClientError && query.error.status === 404;
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-8">
        <a href={back}>Back to Dashboard</a>
        <h1>{missing ? "Card not found" : "Could not load Card"}</h1>
        {!missing ? (
          <button onClick={() => void query.refetch()} type="button">
            Try again
          </button>
        ) : null}
      </main>
    );
  }
  if (query.data.data.status === "empty")
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-8">
        <a href={back}>Back to Dashboard</a>
        <p className="text-sm text-muted-foreground">
          {query.data.bootstrap.dashboard.config.title}
        </p>
        <h1>{query.data.card.name}</h1>
        <p>{query.data.data.message ?? "This Card has no data yet."}</p>
      </main>
    );
  if (query.data.data.status === "error")
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-8">
        <a href={back}>Back to Dashboard</a>
        <p className="text-sm text-muted-foreground">
          {query.data.bootstrap.dashboard.config.title}
        </p>
        <h1>{query.data.card.name}</h1>
        <p>{query.data.data.message}</p>
        <button onClick={() => void query.refetch()} type="button">
          Try again
        </button>
      </main>
    );
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 p-8">
      <a href={back}>Back to Dashboard</a>
      <header>
        <p className="text-sm text-muted-foreground">
          {query.data.bootstrap.dashboard.config.title}
        </p>
        <h1 className="text-3xl font-semibold">{query.data.card.name}</h1>
      </header>
      <section
        className="h-96 rounded-lg border border-border p-6"
        data-slot="drill-down-visualization"
      >
        <CardVisualization data={query.data.data.data} />
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Source data</h2>
        <SourceDataTable data={query.data.data.sourceData} />
      </section>
    </main>
  );
}

export { DashboardDrillDown };
