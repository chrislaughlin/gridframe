import { useQuery } from "@tanstack/react-query";
import { GripVertical } from "lucide-react";
import * as React from "react";
import {
  type DashboardCardConfig,
  type PanelCardDataResponse,
  type PanelCardPayload,
} from "./types";
import {
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
  displayName?: string;
  onRename?: (name: string) => void;
};

function DashboardCard({
  card,
  className,
  displayName = card.name,
  onRename,
}: DashboardCardProps) {
  const query = useQuery({
    queryKey: ["panel-dashboard-card", card.id, card.query],
    queryFn: () => fetchPanelCardData(card.query),
  });
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [draftName, setDraftName] = React.useState(displayName);

  React.useEffect(() => {
    if (!isEditingName) {
      setDraftName(displayName);
    }
  }, [displayName, isEditingName]);

  function saveName() {
    onRename?.(draftName);
    setIsEditingName(false);
  }

  function cancelNameEdit() {
    setDraftName(displayName);
    setIsEditingName(false);
  }

  return (
    <Card
      className={cn("min-h-72 overflow-hidden", className)}
      data-panel-card-id={card.id}
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            {isEditingName ? (
              <input
                aria-label="Card name"
                autoFocus
                className="panel-card-drag-cancel h-8 w-full rounded-md border border-input bg-background px-2 text-sm font-semibold outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                onBlur={saveName}
                onChange={(event) => {
                  setDraftName(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    saveName();
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancelNameEdit();
                  }
                }}
                value={draftName}
              />
            ) : (
              <CardTitle className="truncate">{displayName}</CardTitle>
            )}
            <CardDescription className="truncate">{card.query}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              aria-label="Edit card name"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "panel-card-drag-cancel h-8 px-2 text-muted-foreground",
              )}
              onClick={() => {
                setIsEditingName(true);
              }}
              type="button"
            >
              Edit
            </button>
            <button
              aria-label="Drag card"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "panel-card-drag-handle size-8 cursor-grab text-muted-foreground active:cursor-grabbing",
              )}
              type="button"
            >
              <GripVertical aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden">
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
