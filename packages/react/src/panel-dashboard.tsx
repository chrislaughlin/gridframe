"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PanelDashboardConfig } from "@gridframe/core";

import { DashboardShell } from "./dashboard-shell";

export type PanelDashboardProps = {
  config: PanelDashboardConfig;
  className?: string;
};

function PanelDashboard({ config, className }: PanelDashboardProps) {
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
      <DashboardShell className={className} config={config} />
    </QueryClientProvider>
  );
}

export { PanelDashboard };
