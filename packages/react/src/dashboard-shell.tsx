"use client";

import * as React from "react";
import ReactGridLayout, {
  type Layout,
  type LayoutItem,
  useContainerWidth,
} from "react-grid-layout";
import {
  DASHBOARD_GRID_COLUMNS,
  type DashboardGlobalFilter,
} from "@gridframe/core";
import { type DashboardCardConfig, type PanelDashboardConfig } from "./types";
import { Badge, cn } from "./internal/ui";

import { DashboardCard } from "./dashboard-card";

const DASHBOARD_ROW_HEIGHT = 96;
const DASHBOARD_GRID_GAP: [number, number] = [16, 16];
const DASHBOARD_PHONE_BREAKPOINT = 640;
const DASHBOARD_DESKTOP_BREAKPOINT = 960;
type BoundGlobalFilterValue = Exclude<
  DashboardGlobalFilter["value"],
  undefined
>;

type DashboardShellProps = {
  config: PanelDashboardConfig;
  className?: string;
  toolbar?: React.ReactNode;
  editDisabled?: boolean;
  mutationNotice?: React.ReactNode;
  onLayoutCommit?: (layout: Layout) => void;
  onGlobalFilterChange?: (
    filterId: string,
    value: DashboardGlobalFilter["value"],
  ) => void;
  onRenameCard?: (cardId: string, name: string) => void;
  onRemoveCard?: (cardId: string) => void;
};

function DashboardShell({
  config,
  className,
  toolbar,
  editDisabled = false,
  mutationNotice,
  onLayoutCommit,
  onGlobalFilterChange,
  onRenameCard,
  onRemoveCard,
}: DashboardShellProps) {
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
  const responsiveLayout = React.useMemo(
    () => getResponsiveLayout(layout, width),
    [layout, width],
  );

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

    if (onRenameCard && nextName && nextName !== card.name) {
      onRenameCard(card.id, nextName);
      return;
    }

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
      data-gridframe-root=""
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

        {mutationNotice}

        {config.globalFilters?.length ? (
          <div
            aria-label="Global filters"
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-xs font-medium text-muted-foreground">
              Filters
            </span>
            {config.globalFilters.map((filter) => (
              <GlobalFilterControl
                disabled={editDisabled}
                filter={filter}
                key={filter.id}
                onChange={onGlobalFilterChange}
              />
            ))}
          </div>
        ) : null}

        {config.cards.length ? (
          <div
            className="panel-dashboard-grid"
            data-layout-columns={responsiveLayout.columns}
            data-layout-mode={responsiveLayout.mode}
            ref={containerRef}
          >
            {mounted ? (
              <ReactGridLayout
                className="panel-dashboard-layout"
                dragConfig={{
                  enabled: !editDisabled && responsiveLayout.editable,
                  handle: ".panel-card-drag-handle",
                  cancel: ".panel-card-drag-cancel, a, input, textarea, select",
                  bounded: true,
                }}
                gridConfig={{
                  cols: responsiveLayout.columns,
                  containerPadding: null,
                  margin: DASHBOARD_GRID_GAP,
                  rowHeight: DASHBOARD_ROW_HEIGHT,
                }}
                layout={responsiveLayout.layout}
                onLayoutChange={(nextLayout) => {
                  if (responsiveLayout.editable) {
                    setLayout(nextLayout);
                  }
                }}
                onDragStop={(nextLayout) => {
                  if (!responsiveLayout.editable) return;
                  setLayout(nextLayout);
                  onLayoutCommit?.(nextLayout);
                }}
                onResizeStop={(nextLayout) => {
                  if (!responsiveLayout.editable) return;
                  setLayout(nextLayout);
                  onLayoutCommit?.(nextLayout);
                }}
                resizeConfig={{
                  enabled: !editDisabled && responsiveLayout.editable,
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
                      editDisabled={editDisabled}
                      layoutEditingDisabled={!responsiveLayout.editable}
                      onRename={(name) => {
                        handleRenameCard(card, name);
                      }}
                      onRemove={
                        onRemoveCard ? () => onRemoveCard(card.id) : undefined
                      }
                    />
                  </div>
                ))}
              </ReactGridLayout>
            ) : null}
          </div>
        ) : (
          <div
            className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center"
            data-slot="empty-dashboard"
          >
            <div className="max-w-sm space-y-2">
              <h2 className="text-base font-semibold">Nothing here yet</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Add a Card to start building this Dashboard.
              </p>
            </div>
          </div>
        )}

        {config.footer ? (
          <footer className="flex flex-wrap items-center gap-2 border-t border-border pt-5 text-sm text-muted-foreground">
            {config.footer.href ? (
              <a
                className="inline-flex min-h-11 min-w-11 items-center font-medium text-primary underline-offset-4 hover:underline sm:min-h-0 sm:min-w-0"
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

function GlobalFilterControl({
  filter,
  disabled,
  onChange,
}: {
  filter: NonNullable<PanelDashboardConfig["globalFilters"]>[number];
  disabled: boolean;
  onChange?: (filterId: string, value: DashboardGlobalFilter["value"]) => void;
}) {
  const persistedValue = filterValue(filter.value);
  const [value, setValue] = React.useState(persistedValue);
  const label = filter.label ?? filter.field;
  const acceptsMultipleValues = ["in", "notIn", "between"].includes(
    filter.operator,
  );

  React.useEffect(() => setValue(persistedValue), [persistedValue]);

  return (
    <form
      className="flex items-center gap-1 rounded-md border border-border bg-card p-1"
      onSubmit={(event) => {
        event.preventDefault();
        const nextValue = value.trim();
        onChange?.(
          filter.id,
          nextValue
            ? parseFilterValue(nextValue, acceptsMultipleValues)
            : undefined,
        );
      }}
    >
      <label className="flex items-center gap-2 pl-2 text-xs font-medium">
        <span>{label}</span>
        <input
          aria-label={`${label} filter`}
          className="min-h-11 w-28 rounded border border-input bg-background px-2 py-1 font-normal text-foreground sm:min-h-0"
          disabled={disabled || !onChange}
          onChange={(event) => setValue(event.target.value)}
          placeholder={
            filter.operator === "between"
              ? '["start", "end"]'
              : acceptsMultipleValues
                ? '["A", "B"]'
                : "Any"
          }
          value={value}
        />
      </label>
      <button
        className="min-h-11 min-w-11 rounded px-2 py-1 text-xs font-medium text-primary disabled:text-muted-foreground sm:min-h-0 sm:min-w-0"
        disabled={disabled || !onChange}
        type="submit"
      >
        Apply
      </button>
    </form>
  );
}

function filterValue(value: unknown) {
  if (Array.isArray(value)) return JSON.stringify(value);
  return value === undefined ? "" : filterScalarValue(value);
}

function filterScalarValue(value: unknown) {
  if (typeof value !== "string") return JSON.stringify(value) ?? "";
  if (value !== value.trim()) return JSON.stringify(value);
  try {
    JSON.parse(value);
    return JSON.stringify(value);
  } catch {
    return value;
  }
}

function parseFilterValue(
  value: string,
  multiple: boolean,
): BoundGlobalFilterValue {
  if (!multiple) return parseFilterScalar(value);
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed as BoundGlobalFilterValue;
  } catch {
    // Fall through to the friendly comma-separated shorthand.
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(parseFilterScalar);
}

function parseFilterScalar(value: string): BoundGlobalFilterValue {
  try {
    return JSON.parse(value) as BoundGlobalFilterValue;
  } catch {
    return value;
  }
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

    if (x + width > DASHBOARD_GRID_COLUMNS) {
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

type ResponsiveDashboardLayout = {
  columns: number;
  editable: boolean;
  layout: Layout;
  mode: "desktop" | "phone" | "tablet";
};

function getResponsiveLayout(
  canonicalLayout: Layout,
  width: number,
): ResponsiveDashboardLayout {
  if (width >= DASHBOARD_DESKTOP_BREAKPOINT) {
    return {
      columns: DASHBOARD_GRID_COLUMNS,
      editable: true,
      layout: canonicalLayout,
      mode: "desktop",
    };
  }

  const columns = width < DASHBOARD_PHONE_BREAKPOINT ? 1 : 2;

  return {
    columns,
    editable: false,
    layout: projectLayout(canonicalLayout, columns),
    mode: columns === 1 ? "phone" : "tablet",
  };
}

function projectLayout(canonicalLayout: Layout, columns: number): Layout {
  const sortedLayout = canonicalLayout
    .map(cloneLayoutItem)
    .sort((left, right) => left.y - right.y || left.x - right.x);
  let projectedLayout: Layout = [];

  for (const item of sortedLayout) {
    const columnSpan =
      columns === 1 ? 1 : Math.min(columns, Math.max(1, Math.ceil(item.w / 2)));
    const position = findFirstAvailablePosition(
      projectedLayout,
      columnSpan,
      item.h,
      columns,
    );

    projectedLayout = [
      ...projectedLayout,
      {
        ...item,
        maxW: columns,
        minW: 1,
        w: columnSpan,
        x: position.x,
        y: position.y,
      },
    ];
  }

  return projectedLayout;
}

function findFirstAvailablePosition(
  layout: Layout,
  width: number,
  height: number,
  columns: number,
) {
  for (let y = 0; ; y += 1) {
    for (let x = 0; x <= columns - width; x += 1) {
      const candidate = { height, width, x, y };
      const collides = layout.some((item) =>
        rectanglesOverlap(candidate, {
          height: item.h,
          width: item.w,
          x: item.x,
          y: item.y,
        }),
      );

      if (!collides) {
        return { x, y };
      }
    }
  }
}

type GridRectangle = {
  height: number;
  width: number;
  x: number;
  y: number;
};

function rectanglesOverlap(left: GridRectangle, right: GridRectangle) {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
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
