import { useQuery } from "@tanstack/react-query";
import {
  type DashboardCardConfig,
  type PanelCardDataResponse,
  type PanelCardPayload,
} from "./types";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  buttonVariants,
  cn,
} from "./internal/ui";

import { AreaChartVisualization } from "./visualizations/area-chart-visualization";
import { BarChartVisualization } from "./visualizations/bar-chart-visualization";
import { DashboardCardState } from "./dashboard-card-state";
import { fetchPanelCardData } from "./fetch-panel-card-data";
import { LineChartVisualization } from "./visualizations/line-chart-visualization";
import { MetricVisualization } from "./visualizations/metric-visualization";
import { PieChartVisualization } from "./visualizations/pie-chart-visualization";
import { RadarChartVisualization } from "./visualizations/radar-chart-visualization";
import { RadialChartVisualization } from "./visualizations/radial-chart-visualization";
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
    case "area":
      return <AreaChartVisualization data={payload} />;
    case "bar":
      return <BarChartVisualization data={payload} />;
    case "line":
      return <LineChartVisualization data={payload} />;
    case "pie":
      return <PieChartVisualization data={payload} />;
    case "radar":
      return <RadarChartVisualization data={payload} />;
    case "radial":
      return <RadialChartVisualization data={payload} />;
    case "table":
      return <TableVisualization data={payload} />;
  }
}

function isExternalLink(href: string) {
  return /^https?:\/\//.test(href);
}

export { DashboardCard };
