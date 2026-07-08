import { useQuery } from "@tanstack/react-query";
import { fetchPanelCardData } from "@gridframe/client";
import {
  type DashboardCardConfig,
  type PanelCardDataResponse,
  type PanelCardPayload,
} from "@gridframe/core";
import { Badge } from "@gridframe/ui/badge";
import { buttonVariants } from "@gridframe/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@gridframe/ui/card";
import { cn } from "@gridframe/ui/utils";

import { BarChartVisualization } from "./visualizations/bar-chart-visualization";
import { DashboardCardState } from "./dashboard-card-state";
import { LineChartVisualization } from "./visualizations/line-chart-visualization";
import { MetricVisualization } from "./visualizations/metric-visualization";
import { TableVisualization } from "./visualizations/table-visualization";

type DashboardCardProps = {
  card: DashboardCardConfig;
  className?: string;
};

function DashboardCard({ card, className }: DashboardCardProps) {
  const query = useQuery({
    queryKey: ["panel-dashboard-card", card.id, card.query],
    queryFn: () => fetchPanelCardData(card.query),
  });

  return (
    <Card className={cn("min-h-72", className)} data-panel-card-id={card.id}>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{card.name}</CardTitle>
            <CardDescription>{card.query}</CardDescription>
          </div>
          <Badge variant="outline">{card.visualization}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {query.isPending ? (
          <DashboardCardState state="loading" />
        ) : query.isError ? (
          <DashboardCardState
            message={query.error.message}
            state="error"
            title="Request failed"
          />
        ) : (
          <DashboardCardBody card={card} payload={query.data} />
        )}
      </CardContent>
      {card.deeplink ? (
        <CardFooter className="pt-0">
          <a
            className={cn(
              buttonVariants({ variant: "link", size: "sm" }),
              "h-auto px-0 text-xs",
            )}
            href={card.deeplink.href}
            rel={isExternalLink(card.deeplink.href) ? "noreferrer" : undefined}
            target={isExternalLink(card.deeplink.href) ? "_blank" : undefined}
          >
            {card.deeplink.label ?? "Open details"}
          </a>
        </CardFooter>
      ) : null}
    </Card>
  );
}

function DashboardCardBody({
  card,
  payload,
}: {
  card: DashboardCardConfig;
  payload: PanelCardDataResponse;
}) {
  if (payload.status === "empty") {
    return (
      <DashboardCardState
        message={payload.message ?? "This card has no data yet."}
        state="empty"
        title="No data"
      />
    );
  }

  if (payload.status === "error") {
    return (
      <DashboardCardState
        message={payload.message}
        state="error"
        title="Card returned an error"
      />
    );
  }

  if (payload.data.visualization !== card.visualization) {
    return (
      <DashboardCardState
        message={`Expected ${card.visualization}, received ${payload.data.visualization}.`}
        state="error"
        title="Visualization mismatch"
      />
    );
  }

  return renderVisualization(payload.data);
}

function renderVisualization(payload: PanelCardPayload) {
  switch (payload.visualization) {
    case "metric":
      return <MetricVisualization data={payload} />;
    case "bar":
      return <BarChartVisualization data={payload} />;
    case "line":
      return <LineChartVisualization data={payload} />;
    case "table":
      return <TableVisualization data={payload} />;
  }
}

function isExternalLink(href: string) {
  return /^https?:\/\//.test(href);
}

export { DashboardCard };
