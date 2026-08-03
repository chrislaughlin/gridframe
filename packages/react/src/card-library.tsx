"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DashboardClientError,
  addDashboardCard,
  bootstrapDashboard,
  listCardLibrary,
  removeDashboardCard,
} from "@gridframe/client";
import type {
  CardLibraryResponse,
  CardLibraryItem,
  DashboardBootstrapResponse,
  DashboardDocument,
} from "@gridframe/core";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./internal/ui";
import { CardLibraryPreview } from "./card-library-preview";

type Props = {
  userId: string;
  apiBaseUrl?: string;
  dashboard: DashboardDocument;
  disabled: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDashboardChange: (dashboard: DashboardDocument) => void;
};

function CardLibrary({
  userId,
  apiBaseUrl,
  dashboard,
  disabled,
  open,
  onOpenChange,
  onDashboardChange,
}: Props) {
  const queryClient = useQueryClient();
  const identity = { userId, apiBaseUrl, dashboardId: dashboard.id };
  const queryKey = [
    "gridframe-card-library",
    apiBaseUrl,
    userId,
    dashboard.id,
  ] as const;
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => listCardLibrary({ ...identity, signal }),
  });
  const mutation = useMutation({
    mutationFn: (
      action:
        | { kind: "add"; item: CardLibraryItem }
        | { kind: "remove"; cardId: string },
    ) =>
      action.kind === "add"
        ? addDashboardCard({
            ...identity,
            revision: dashboard.revision,
            libraryItemKey: action.item.key,
          })
        : removeDashboardCard({
            ...identity,
            revision: dashboard.revision,
            cardId: action.cardId,
          }),
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CardLibraryResponse>(queryKey);
      queryClient.setQueryData<CardLibraryResponse>(queryKey, (current) =>
        current
          ? {
              items: current.items.map((item) =>
                action.kind === "add" && item.key === action.item.key
                  ? { ...item, addedCardId: `pending:${item.key}` }
                  : action.kind === "remove" &&
                      item.addedCardId === action.cardId
                    ? { ...item, addedCardId: undefined }
                    : item,
              ),
            }
          : current,
      );
      if (action.kind === "add") {
        const y = dashboard.config.cards.reduce(
          (bottom, card) =>
            Math.max(
              bottom,
              (card.layout?.y ?? 0) + (card.layout?.height ?? 0),
            ),
          0,
        );
        onDashboardChange({
          ...dashboard,
          config: {
            ...dashboard.config,
            cards: [
              ...dashboard.config.cards,
              {
                id: `pending:${action.item.key}`,
                name: action.item.name,
                visualization: action.item.visualization,
                query: 'data:application/json,{"status":"empty"}',
                layout: { x: 0, y, ...action.item.defaultLayout },
              },
            ],
          },
        });
      } else {
        onDashboardChange({
          ...dashboard,
          config: {
            ...dashboard.config,
            cards: dashboard.config.cards.filter(
              (card) => card.id !== action.cardId,
            ),
          },
        });
      }
      return { previous, previousDashboard: dashboard };
    },
    onSuccess: (response) => {
      queryClient.setQueryData<CardLibraryResponse>(
        queryKey,
        response.cardLibrary,
      );
      queryClient.setQueriesData<DashboardBootstrapResponse>(
        { queryKey: ["gridframe-dashboard", apiBaseUrl, userId] },
        (current) =>
          current ? { ...current, dashboard: response.dashboard } : current,
      );
      onDashboardChange(response.dashboard);
    },
    onError: async (error, _action, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      onDashboardChange(context?.previousDashboard ?? dashboard);
      if (
        error instanceof DashboardClientError &&
        error.code === "REVISION_CONFLICT"
      ) {
        const current = await bootstrapDashboard(identity);
        onDashboardChange(current.dashboard);
        await query.refetch();
      }
    },
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button variant="outline">Card library</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(52rem,calc(100vh-2rem))] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Card library</DialogTitle>
          <DialogDescription>
            Add or remove Cards from this Dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0">
          {query.isPending ? (
            <p className="text-sm text-muted-foreground">
              Loading Card library...
            </p>
          ) : null}
          {query.isError ? (
            <Button
              onClick={() => void query.refetch()}
              size="sm"
              variant="outline"
            >
              Retry Card library
            </Button>
          ) : null}
          {query.data ? (
            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {query.data.items.map((item) => (
                <div
                  className="flex min-w-0 flex-col gap-3 overflow-hidden rounded-lg border border-border bg-card p-3"
                  key={item.key}
                >
                  <CardLibraryPreview visualization={item.visualization} />
                  <div className="flex min-h-16 min-w-0 flex-1 flex-col gap-1">
                    <p className="line-clamp-2 break-words text-sm font-medium">
                      {item.name}
                    </p>
                    {item.description ? (
                      <p className="line-clamp-2 break-words text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    className="w-full"
                    disabled={disabled || mutation.isPending}
                    onClick={() =>
                      mutation.mutate(
                        item.addedCardId
                          ? { kind: "remove", cardId: item.addedCardId }
                          : { kind: "add", item },
                      )
                    }
                    size="sm"
                    variant="outline"
                  >
                    {item.addedCardId ? "Remove" : "Add"}
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
          {mutation.isError ? (
            <div
              role="status"
              className="flex items-center justify-between gap-2 pt-2 text-xs text-destructive"
            >
              <span>
                {mutation.error instanceof DashboardClientError &&
                mutation.error.code === "REVISION_CONFLICT"
                  ? "Newer Dashboard changes replaced your Card library edit."
                  : mutation.error.message}
              </span>
              {mutation.variables ? (
                <Button
                  onClick={() => mutation.mutate(mutation.variables!)}
                  size="sm"
                  variant="ghost"
                >
                  Retry
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { CardLibrary };
