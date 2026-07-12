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

type Props = {
  userId: string;
  apiBaseUrl?: string;
  dashboard: DashboardDocument;
  disabled: boolean;
  onDashboardChange: (dashboard: DashboardDocument) => void;
};

function CardLibrary({
  userId,
  apiBaseUrl,
  dashboard,
  disabled,
  onDashboardChange,
}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
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
    <div className="flex flex-col items-end gap-3">
      <button
        className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        Card library
      </button>
      {open ? (
        <section
          aria-label="Card library"
          className="w-full min-w-72 rounded-lg border border-border bg-background p-3 shadow-lg"
        >
          {query.isPending ? (
            <p className="text-sm text-muted-foreground">
              Loading Card library...
            </p>
          ) : null}
          {query.isError ? (
            <button onClick={() => void query.refetch()} type="button">
              Retry Card library
            </button>
          ) : null}
          {query.data?.items.map((item) => (
            <div
              className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0"
              key={item.key}
            >
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                {item.description ? (
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <button
                className="rounded-md border border-input px-2 py-1 text-xs font-medium"
                disabled={disabled || mutation.isPending}
                onClick={() =>
                  mutation.mutate(
                    item.addedCardId
                      ? { kind: "remove", cardId: item.addedCardId }
                      : { kind: "add", item },
                  )
                }
                type="button"
              >
                {item.addedCardId ? "Remove" : "Add"}
              </button>
            </div>
          ))}
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
                <button
                  className="font-medium"
                  onClick={() => mutation.mutate(mutation.variables!)}
                  type="button"
                >
                  Retry
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

export { CardLibrary };
