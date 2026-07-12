"use client";

import * as React from "react";
import {
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  DashboardClientError,
  bootstrapDashboard,
  updateDashboardCard,
  updateDashboardLayout,
} from "@gridframe/client";
import type {
  DashboardBootstrapResponse,
  DashboardDocument,
} from "@gridframe/core";
import type { Layout } from "react-grid-layout";
import { type PanelDashboardConfig } from "./types";

import { DashboardShell } from "./dashboard-shell";
import { CardLibrary } from "./card-library";

type ApiManagedDashboardOptions = {
  userId: string;
  dashboardId?: string;
  apiBaseUrl?: string;
  onDashboardChange?: (dashboardId: string) => void;
};

export type PanelDashboardProps =
  | {
      config: PanelDashboardConfig;
      dashboard?: never;
      className?: string;
    }
  | {
      config?: never;
      dashboard: ApiManagedDashboardOptions;
      className?: string;
    };

function PanelDashboard(props: PanelDashboardProps) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {props.dashboard ? (
        <ApiManagedDashboard
          className={props.className}
          options={props.dashboard}
        />
      ) : (
        <DashboardShell className={props.className} config={props.config} />
      )}
    </QueryClientProvider>
  );
}

function ApiManagedDashboard({
  options,
  className,
}: {
  options: ApiManagedDashboardOptions;
  className?: string;
}) {
  const [localDashboardId, setLocalDashboardId] = React.useState<string>();
  const queryClient = useQueryClient();
  const [confirmedDashboard, setConfirmedDashboard] =
    React.useState<DashboardDocument>();
  const [displayDashboard, setDisplayDashboard] =
    React.useState<DashboardDocument>();
  const [notice, setNotice] = React.useState<string>();
  const [isCardLibraryOpen, setIsCardLibraryOpen] = React.useState(false);
  const [shellEpoch, setShellEpoch] = React.useState(0);
  const [retryAction, setRetryAction] =
    React.useState<DashboardMutationAction>();
  const mutationInFlight = React.useRef(false);
  const selectedDashboardId = options.dashboardId ?? localDashboardId;
  const queryKey = [
    "gridframe-dashboard",
    options.apiBaseUrl,
    options.userId,
    selectedDashboardId,
  ] as const;
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      bootstrapDashboard({
        userId: options.userId,
        dashboardId: selectedDashboardId,
        apiBaseUrl: options.apiBaseUrl,
        signal,
      }),
    placeholderData: keepPreviousData,
  });
  const mutation = useMutation({
    mutationFn: (action: DashboardMutationAction) => {
      const identity = {
        userId: options.userId,
        dashboardId: action.optimistic.id,
        apiBaseUrl: options.apiBaseUrl,
      };
      return action.kind === "layout"
        ? updateDashboardLayout({
            ...identity,
            revision: action.revision,
            cards: action.cards,
          })
        : updateDashboardCard({
            ...identity,
            cardId: action.cardId,
            revision: action.revision,
            name: action.name,
          });
    },
    onMutate: (action) => {
      setNotice(undefined);
      setRetryAction(undefined);
      if (action.kind !== "layout") {
        setDisplayDashboard(action.optimistic);
      }
    },
    onSuccess: (dashboard, action) => {
      queryClient.setQueryData<DashboardBootstrapResponse>(
        action.queryKey,
        (current) => (current ? { ...current, dashboard } : current),
      );
      if (query.data?.dashboard.id !== action.optimistic.id) return;
      setConfirmedDashboard(dashboard);
      setDisplayDashboard(dashboard);
    },
    onError: async (error, action) => {
      if (query.data?.dashboard.id !== action.optimistic.id) {
        await queryClient.invalidateQueries({ queryKey: action.queryKey });
        return;
      }
      if (
        error instanceof DashboardClientError &&
        error.code === "REVISION_CONFLICT"
      ) {
        setNotice("Newer Dashboard changes replaced your edit.");
        setShellEpoch((value) => value + 1);
        const result = await query.refetch();
        if (result.data) {
          setConfirmedDashboard(result.data.dashboard);
          setDisplayDashboard(result.data.dashboard);
        }
        return;
      }
      setDisplayDashboard(confirmedDashboard);
      setShellEpoch((value) => value + 1);
      setRetryAction(action);
      setNotice(error.message);
    },
    onSettled: () => {
      mutationInFlight.current = false;
    },
  });

  function startMutation(action: DashboardMutationAction) {
    if (mutationInFlight.current || query.isFetching) return;
    mutationInFlight.current = true;
    mutation.mutate(action);
  }

  React.useEffect(() => {
    if (query.data) {
      setConfirmedDashboard(query.data.dashboard);
      setDisplayDashboard(query.data.dashboard);
    }
  }, [query.data]);

  if (query.isPending) {
    return <DashboardLoadState message="Loading dashboard..." />;
  }

  if (query.isError) {
    return (
      <DashboardLoadState
        action={
          <button
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => void query.refetch()}
            type="button"
          >
            Try again
          </button>
        }
        message={query.error.message}
      />
    );
  }

  const response = query.data;
  const dashboard = displayDashboard ?? response.dashboard;
  const dashboardSelector =
    response.dashboards.length > 1 ? (
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Dashboard</span>
        <select
          aria-label="Dashboard"
          className="rounded-md border border-input bg-background px-3 py-2 text-foreground"
          disabled={query.isFetching || mutation.isPending}
          onChange={(event) => {
            const dashboardId = event.target.value;
            if (options.dashboardId === undefined) {
              setLocalDashboardId(dashboardId);
            }
            options.onDashboardChange?.(dashboardId);
          }}
          value={response.dashboard.id}
        >
          {response.dashboards.map((dashboard) => (
            <option key={dashboard.id} value={dashboard.id}>
              {dashboard.title}
            </option>
          ))}
        </select>
        {query.isFetching ? <span>Loading selection...</span> : null}
      </label>
    ) : null;
  const toolbar = (
    <div className="flex flex-col items-end gap-3">
      {dashboardSelector}
      <CardLibrary
        apiBaseUrl={options.apiBaseUrl}
        dashboard={dashboard}
        disabled={mutation.isPending || query.isFetching}
        onOpenChange={setIsCardLibraryOpen}
        onDashboardChange={(next) => {
          setConfirmedDashboard(next);
          setDisplayDashboard(next);
          setShellEpoch((value) => value + 1);
        }}
        open={isCardLibraryOpen}
        userId={options.userId}
      />
    </div>
  );

  return (
    <DashboardShell
      key={`${dashboard.id}:${shellEpoch}`}
      className={className}
      config={dashboard.config}
      editDisabled={mutation.isPending || query.isFetching}
      mutationNotice={
        notice ? (
          <div
            className="flex items-center justify-between gap-3 rounded-md border border-border px-4 py-3 text-sm"
            role="status"
          >
            <span>{notice}</span>
            {retryAction ? (
              <button
                className="font-medium text-primary"
                onClick={() => startMutation(retryAction)}
                type="button"
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : null
      }
      onLayoutCommit={(layout) => {
        if (mutationInFlight.current || query.isFetching) return;
        const cards = layout.map((item) => ({
          id: item.i,
          x: item.x,
          y: item.y,
          width: item.w,
          height: item.h,
        }));
        const optimistic = applyLayout(dashboard, layout);
        startMutation({
          kind: "layout",
          queryKey,
          revision: dashboard.revision,
          cards,
          optimistic,
        });
      }}
      onRenameCard={(cardId, name) => {
        if (mutationInFlight.current || query.isFetching) return;
        startMutation({
          kind: "rename",
          queryKey,
          revision: dashboard.revision,
          cardId,
          name,
          optimistic: {
            ...dashboard,
            config: {
              ...dashboard.config,
              cards: dashboard.config.cards.map((card) =>
                card.id === cardId ? { ...card, name } : card,
              ),
            },
          },
        });
      }}
      toolbar={toolbar}
    />
  );
}

type DashboardMutationAction =
  | {
      kind: "layout";
      queryKey: readonly [
        string,
        string | undefined,
        string,
        string | undefined,
      ];
      revision: string;
      cards: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
      optimistic: DashboardDocument;
    }
  | {
      kind: "rename";
      queryKey: readonly [
        string,
        string | undefined,
        string,
        string | undefined,
      ];
      revision: string;
      cardId: string;
      name: string;
      optimistic: DashboardDocument;
    };

function applyLayout(
  dashboard: DashboardDocument,
  layout: Layout,
): DashboardDocument {
  const byId = new Map(layout.map((item) => [item.i, item]));
  return {
    ...dashboard,
    config: {
      ...dashboard.config,
      cards: dashboard.config.cards.map((card) => {
        const item = byId.get(card.id);
        return item
          ? {
              ...card,
              layout: { x: item.x, y: item.y, width: item.w, height: item.h },
            }
          : card;
      }),
    },
  };
}

function DashboardLoadState({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="flex min-h-svh items-center justify-center bg-background px-6 text-foreground">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        {action}
      </div>
    </section>
  );
}

export { PanelDashboard };
