"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  cn,
} from "../internal/ui";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { type AreaChartCardData, type ChartTooltipOptions } from "../types";
import { getChartConfig } from "./chart-config";

type AreaChartVisualizationProps = {
  data: AreaChartCardData;
};

function AreaChartVisualization({ data }: AreaChartVisualizationProps) {
  const chartConfig = getChartConfig(data.series);
  const visibleSeries = data.interactive
    ? data.series.slice(0, 1)
    : data.series;

  return (
    <div className="space-y-3">
      {data.interactive ? <SegmentedSummary data={data} /> : null}
      <ChartContainer className="h-64 w-full" config={chartConfig}>
        <AreaChart
          accessibilityLayer
          data={data.data}
          margin={{ left: 0, right: 8 }}
          stackOffset={data.stackOffset}
        >
          {data.showGradient ? (
            <defs>
              {data.series.map((series) => (
                <linearGradient
                  id={`fill-${series.key}`}
                  key={series.key}
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${series.key})`}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${series.key})`}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
          ) : null}
          <CartesianGrid vertical={data.showAxes ?? false} />
          <XAxis
            axisLine={false}
            dataKey={data.indexKey}
            tickLine={false}
            tickMargin={8}
          />
          {data.showAxes ? (
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              width={36}
            />
          ) : null}
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
                labelFormatter={getLabelFormatter(data.tooltip?.labelFormatter)}
              />
            }
            cursor={false}
          />
          {visibleSeries.map((series) => (
            <Area
              dataKey={series.key}
              fill={
                data.showGradient
                  ? `url(#fill-${series.key})`
                  : `var(--color-${series.key})`
              }
              fillOpacity={0.22}
              isAnimationActive={false}
              key={series.key}
              stackId={data.stacked || data.stackOffset ? "area" : undefined}
              stroke={`var(--color-${series.key})`}
              strokeWidth={2}
              type={data.curveType ?? "natural"}
            />
          ))}
        </AreaChart>
      </ChartContainer>
      {data.showLegend ? <ChartLegend data={data} /> : null}
    </div>
  );
}

function SegmentedSummary({ data }: { data: AreaChartCardData }) {
  return (
    <div className="grid grid-cols-2 rounded-md border border-border text-xs">
      {data.series.slice(0, 2).map((series, index) => (
        <div
          className={cn("p-3", index === 0 && "border-r border-border")}
          key={series.key}
        >
          <div className="text-muted-foreground">{series.label}</div>
          <div className="mt-1 text-lg font-semibold text-foreground">
            {sumSeries(data, series.key).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartLegend({ data }: { data: AreaChartCardData }) {
  return (
    <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
      {data.series.map((series) => (
        <div className="flex items-center gap-2" key={series.key}>
          <span
            className="size-2 rounded-[2px]"
            style={{ backgroundColor: `var(--color-${series.key})` }}
          />
          {series.icon ? (
            <span className="font-mono text-[10px]">{series.icon}</span>
          ) : null}
          <span>{series.label}</span>
        </div>
      ))}
    </div>
  );
}

function sumSeries(data: AreaChartCardData, key: string) {
  return data.data.reduce((sum, datum) => sum + Number(datum[key] ?? 0), 0);
}

function getLabelFormatter(formatter: ChartTooltipOptions["labelFormatter"]) {
  if (formatter !== "date") {
    return undefined;
  }

  return (label: unknown) =>
    new Date(String(label)).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
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

export { AreaChartVisualization };
