"use client";

import * as React from "react";
import {
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import { bootstrapDashboard } from "@gridframe/client";
import { type PanelDashboardConfig } from "./types";

import { DashboardShell } from "./dashboard-shell";

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
  const selectedDashboardId = options.dashboardId ?? localDashboardId;
  const query = useQuery({
    queryKey: [
      "gridframe-dashboard",
      options.apiBaseUrl,
      options.userId,
      selectedDashboardId,
    ],
    queryFn: ({ signal }) =>
      bootstrapDashboard({
        userId: options.userId,
        dashboardId: selectedDashboardId,
        apiBaseUrl: options.apiBaseUrl,
        signal,
      }),
    placeholderData: keepPreviousData,
  });

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
  const toolbar =
    response.dashboards.length > 1 ? (
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Dashboard</span>
        <select
          aria-label="Dashboard"
          className="rounded-md border border-input bg-background px-3 py-2 text-foreground"
          disabled={query.isFetching}
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

  return (
    <DashboardShell
      className={className}
      config={response.dashboard.config}
      toolbar={toolbar}
    />
  );
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
