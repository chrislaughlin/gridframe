import { useQuery } from "@tanstack/react-query";
import { GripVertical, Pencil } from "lucide-react";
import * as React from "react";
import { type DashboardCardConfig, type PanelCardDataResponse } from "./types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  buttonVariants,
  cn,
} from "./internal/ui";

import { DashboardCardState } from "./dashboard-card-state";
import { fetchPanelCardData } from "./fetch-panel-card-data";
import { CardVisualization } from "./card-visualization";

type DashboardCardProps = {
  card: DashboardCardConfig;
  className?: string;
  displayName?: string;
  editDisabled?: boolean;
  layoutEditingDisabled?: boolean;
  onRename?: (name: string) => void;
  onRemove?: () => void;
};

function DashboardCard({
  card,
  className,
  displayName = card.name,
  editDisabled = false,
  layoutEditingDisabled = false,
  onRename,
  onRemove,
}: DashboardCardProps) {
  const query = useQuery({
    queryKey: ["panel-dashboard-card", card.id, card.source, card.query],
    queryFn: ({ signal }) => {
      if (card.source?.type === "inline") return card.source.data;
      const remote = card.source?.type === "remote" ? card.source : undefined;
      const url = remote?.url ?? card.query;
      if (!url) throw new Error("Card has no data source");
      return fetchPanelCardData(url, { ...remote?.request, signal });
    },
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
      data-panel-card-editing={isEditingName ? "true" : undefined}
      data-panel-card-id={card.id}
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            {isEditingName ? (
              <input
                aria-label="Card name"
                autoFocus
                className="panel-card-drag-cancel h-11 w-full rounded-md border border-input bg-background px-2 text-sm font-semibold outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-8"
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
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onRemove ? (
              <button
                aria-label="Remove card"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "panel-card-drag-cancel h-11 px-2 text-muted-foreground sm:h-8",
                )}
                disabled={editDisabled}
                onClick={onRemove}
                type="button"
              >
                Remove
              </button>
            ) : null}
            <button
              aria-label="Edit card name"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "panel-card-drag-cancel size-11 text-muted-foreground sm:size-8",
              )}
              onClick={() => {
                setIsEditingName(true);
              }}
              disabled={editDisabled}
              type="button"
            >
              <Pencil aria-hidden="true" className="size-4" />
            </button>
            <button
              aria-label="Drag card"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "panel-card-drag-handle size-11 cursor-grab text-muted-foreground active:cursor-grabbing sm:size-8",
              )}
              disabled={editDisabled || layoutEditingDisabled}
              type="button"
            >
              <GripVertical aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 overflow-hidden">
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
              "h-auto min-h-11 px-0 text-xs sm:min-h-0",
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

  return <CardVisualization data={payload.data} />;
}

function isExternalLink(href: string) {
  return /^https?:\/\//.test(href);
}

export { DashboardCard };
