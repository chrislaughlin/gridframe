"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../internal/ui";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { type ChartTooltipOptions, type RadarChartCardData } from "../types";
import { getChartConfig } from "./chart-config";

type RadarChartVisualizationProps = {
  data: RadarChartCardData;
};

function RadarChartVisualization({ data }: RadarChartVisualizationProps) {
  const chartConfig = getChartConfig(data.series);

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col gap-3"
      data-slot="flex-chart-visualization"
    >
      <ChartContainer
        className="aspect-auto h-full min-h-0 w-full"
        config={chartConfig}
      >
        <RadarChart accessibilityLayer data={data.data}>
          {data.gridLines === false ? null : (
            <PolarGrid
              gridType={data.gridType ?? "circle"}
              radialLines={data.radialLines ?? true}
              stroke={data.gridFill ? "var(--muted-foreground)" : undefined}
              strokeOpacity={data.gridFill ? 0.25 : undefined}
            />
          )}
          <PolarAngleAxis
            dataKey={data.indexKey}
            tick={(props) => (
              <CustomAngleTick custom={Boolean(data.customLabels)} {...props} />
            )}
            tickLine={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={getValueFormatter(data.tooltip?.valueFormatter)}
                hideIndicator={data.tooltip?.indicator === "none"}
                hideLabel={data.tooltip?.hideLabel}
                indicator={
                  data.tooltip?.indicator === "none"
                    ? undefined
                    : data.tooltip?.indicator
                }
              />
            }
            cursor={false}
          />
          {data.series.map((series) => (
            <Radar
              dataKey={series.key}
              fill={`var(--color-${series.key})`}
              fillOpacity={data.linesOnly ? 0 : data.gridFill ? 0.35 : 0.22}
              isAnimationActive={false}
              key={series.key}
              legendType="circle"
              stroke={`var(--color-${series.key})`}
              strokeWidth={2}
              dot={data.showDots}
            />
          ))}
        </RadarChart>
      </ChartContainer>
      {data.showLegend ? <ChartLegend data={data} /> : null}
    </div>
  );
}

function CustomAngleTick({
  custom,
  payload,
  x,
  y,
  textAnchor,
}: {
  custom: boolean;
  payload?: { value?: string };
  x?: number | string;
  y?: number | string;
  textAnchor?: "end" | "inherit" | "middle" | "start";
}) {
  return (
    <text
      className={
        custom
          ? "fill-foreground text-[11px] font-medium"
          : "fill-muted-foreground text-xs"
      }
      textAnchor={textAnchor}
      x={x}
      y={y}
    >
      {custom ? String(payload?.value ?? "").toUpperCase() : payload?.value}
    </text>
  );
}

function ChartLegend({ data }: { data: RadarChartCardData }) {
  return (
    <div className="flex shrink-0 flex-wrap justify-center gap-4 text-xs text-muted-foreground">
      {data.series.map((series) => (
        <div className="flex items-center gap-2" key={series.key}>
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: `var(--color-${series.key})` }}
          />
          <span>{series.label}</span>
        </div>
      ))}
    </div>
  );
}

function getValueFormatter(formatter: ChartTooltipOptions["valueFormatter"]) {
  if (!formatter) {
    return undefined;
  }

  return (value: unknown) => {
    const number = Number(value ?? 0);

    if (formatter === "currency") {
      return new Intl.NumberFormat("en-US", {
        currency: "USD",
        style: "currency",
      }).format(number);
    }

    if (formatter === "percent") {
      return `${number}%`;
    }

    return new Intl.NumberFormat("en-US", {
      notation: "compact",
    }).format(number);
  };
}

export { RadarChartVisualization };
