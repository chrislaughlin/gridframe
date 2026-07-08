"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import {
  type ResponsiveContainerProps,
  type TooltipContentProps,
} from "recharts";

import { cn } from "./utils";

type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

type ChartContextValue = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a ChartContainer");
  }

  return context;
}

type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: ResponsiveContainerProps["children"];
};

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: ChartContainerProps) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn(
          "flex aspect-video justify-center text-xs text-muted-foreground [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/70 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        data-chart={chartId}
        data-slot="chart"
        {...props}
      >
        <ChartStyle config={config} id={chartId} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorEntries = Object.entries(config).filter(([, item]) => item.color);

  if (!colorEntries.length) {
    return null;
  }

  const cssVars = colorEntries
    .map(([key, item]) => `  --color-${key}: ${item.color};`)
    .join("\n");

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart="${id}"] {\n${cssVars}\n}`,
      }}
    />
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartTooltipContentProps = Partial<TooltipContentProps> & {
  className?: string;
};

function ChartTooltipContent({
  active,
  className,
  label,
  payload,
}: ChartTooltipContentProps) {
  const { config } = useChart();
  const items = payload ?? [];

  if (!active || !items.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid min-w-36 gap-2 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md",
        className,
      )}
      data-slot="chart-tooltip"
    >
      {label ? (
        <div className="font-medium text-foreground">{label}</div>
      ) : null}
      <div className="grid gap-1.5">
        {items.map((item) => {
          const key = String(item.dataKey ?? item.name ?? "");
          const itemConfig = config[key];
          const itemLabel = itemConfig?.label ?? item.name ?? key;
          const color = item.color ?? item.fill ?? itemConfig?.color;

          return (
            <div
              className="flex items-center justify-between gap-6"
              key={`${key}-${String(item.value)}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-[2px]"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">{itemLabel}</span>
              </div>
              <span className="font-mono font-medium text-foreground">
                {String(item.value ?? "")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig };
