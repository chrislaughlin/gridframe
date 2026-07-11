"use client";

import * as React from "react";
import ReactGridLayout, {
  type Layout,
  type LayoutItem,
  useContainerWidth,
} from "react-grid-layout";
import { type DashboardCardConfig, type PanelDashboardConfig } from "./types";
import { Badge, cn } from "./internal/ui";

import { DashboardCard } from "./dashboard-card";

const DASHBOARD_COLUMNS = 4;
const DASHBOARD_ROW_HEIGHT = 96;
const DASHBOARD_GRID_GAP: [number, number] = [16, 16];

type DashboardShellProps = {
  config: PanelDashboardConfig;
  className?: string;
  toolbar?: React.ReactNode;
};

function DashboardShell({ config, className, toolbar }: DashboardShellProps) {
  const { containerRef, mounted, width } = useContainerWidth({
    measureBeforeMount: true,
  });
  const cardSignature = React.useMemo(
    () => config.cards.map((card) => card.id).join("|"),
    [config.cards],
  );
  const [layout, setLayout] = React.useState<Layout>(() =>
    getInitialLayout(config.cards),
  );
  const [namesByCardId, setNamesByCardId] = React.useState<
    Record<string, string>
  >({});

  React.useEffect(() => {
    setLayout((currentLayout) =>
      mergeLayoutWithCards(currentLayout, config.cards),
    );
    setNamesByCardId((currentNames) => {
      const cardIds = new Set(config.cards.map((card) => card.id));

      return Object.fromEntries(
        Object.entries(currentNames).filter(([cardId]) => cardIds.has(cardId)),
      );
    });
  }, [cardSignature, config.cards]);

  function handleRenameCard(card: DashboardCardConfig, name: string) {
    const nextName = name.trim();

    setNamesByCardId((currentNames) => {
      const nextNames = { ...currentNames };

      if (!nextName || nextName === card.name) {
        delete nextNames[card.id];
      } else {
        nextNames[card.id] = nextName;
      }

      return nextNames;
    });
  }

  return (
    <section
      aria-labelledby="panel-dashboard-title"
      className={cn("min-h-svh bg-background text-foreground", className)}
      data-slot="panel-dashboard"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="muted">Gridframe dashboard</Badge>
            <div className="space-y-2">
              <h1
                className="text-2xl font-semibold tracking-tight sm:text-3xl"
                id="panel-dashboard-title"
              >
                {config.title}
              </h1>
              {config.description ? (
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {config.description}
                </p>
              ) : null}
            </div>
          </div>
          {toolbar}
        </header>

        <div className="panel-dashboard-grid" ref={containerRef}>
          {mounted ? (
            <ReactGridLayout
              className="panel-dashboard-layout"
              dragConfig={{
                enabled: true,
                handle: ".panel-card-drag-handle",
                cancel: ".panel-card-drag-cancel, a, input, textarea, select",
                bounded: true,
              }}
              gridConfig={{
                cols: DASHBOARD_COLUMNS,
                containerPadding: null,
                margin: DASHBOARD_GRID_GAP,
                rowHeight: DASHBOARD_ROW_HEIGHT,
              }}
              layout={layout}
              onLayoutChange={(nextLayout) => {
                setLayout(nextLayout);
              }}
              resizeConfig={{
                enabled: true,
                handles: ["s", "e", "se"],
              }}
              width={width}
            >
              {config.cards.map((card) => (
                <div key={card.id}>
                  <DashboardCard
                    card={card}
                    className="h-full min-h-0"
                    displayName={namesByCardId[card.id] ?? card.name}
                    onRename={(name) => {
                      handleRenameCard(card, name);
                    }}
                  />
                </div>
              ))}
            </ReactGridLayout>
          ) : null}
        </div>

        {config.footer ? (
          <footer className="flex flex-wrap items-center gap-2 border-t border-border pt-5 text-sm text-muted-foreground">
            {config.footer.href ? (
              <a
                className="font-medium text-primary underline-offset-4 hover:underline"
                href={config.footer.href}
              >
                {config.footer.text}
              </a>
            ) : (
              <span>{config.footer.text}</span>
            )}
          </footer>
        ) : null}
      </div>
    </section>
  );
}

function getInitialLayout(cards: DashboardCardConfig[]): Layout {
  let x = 0;
  let y = 0;
  let rowHeight = 0;

  return cards.map((card) => {
    const width = card.layout?.width ?? getDefaultCardWidth(card);
    const height = card.layout?.height ?? getDefaultCardHeight(card);

    if (card.layout) {
      return {
        h: height,
        i: card.id,
        minH: 2,
        minW: 1,
        w: width,
        x: card.layout.x,
        y: card.layout.y,
      };
    }

    if (x + width > DASHBOARD_COLUMNS) {
      x = 0;
      y += rowHeight;
      rowHeight = 0;
    }

    const item: LayoutItem = {
      h: height,
      i: card.id,
      minH: 2,
      minW: 1,
      w: width,
      x,
      y,
    };

    x += width;
    rowHeight = Math.max(rowHeight, height);

    return item;
  });
}

function mergeLayoutWithCards(
  currentLayout: Layout,
  cards: DashboardCardConfig[],
): Layout {
  const currentById = new Map(
    currentLayout.map((item) => [item.i, item] as const),
  );
  let nextLayout: Layout = [];

  for (const card of cards) {
    const currentItem = currentById.get(card.id);

    if (currentItem) {
      nextLayout = [...nextLayout, cloneLayoutItem(currentItem)];
    } else {
      const width = getDefaultCardWidth(card);
      const height = getDefaultCardHeight(card);

      nextLayout = [
        ...nextLayout,
        {
          h: height,
          i: card.id,
          minH: 2,
          minW: 1,
          w: width,
          x: 0,
          y: getNextRow(nextLayout),
        },
      ];
    }
  }

  return nextLayout;
}

function cloneLayoutItem(item: LayoutItem): LayoutItem {
  return { ...item };
}

function getDefaultCardWidth(card: DashboardCardConfig) {
  return card.visualization === "metric" ? 1 : 2;
}

function getDefaultCardHeight(card: DashboardCardConfig) {
  return card.visualization === "metric" ? 2 : 4;
}

function getNextRow(layout: Layout) {
  if (!layout.length) {
    return 0;
  }

  return Math.max(...layout.map((item) => item.y + item.h));
}

export { DashboardShell };
