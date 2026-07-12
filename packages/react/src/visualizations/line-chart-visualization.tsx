"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../internal/ui";
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { type ChartTooltipOptions, type LineChartCardData } from "../types";
import { getChartConfig } from "./chart-config";

type LineChartVisualizationProps = {
  data: LineChartCardData;
};

function LineChartVisualization({ data }: LineChartVisualizationProps) {
  const chartConfig = getChartConfig(data.series);
  const visibleSeries = data.interactive
    ? data.series.slice(0, 1)
    : data.series;

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col gap-3"
      data-slot="flex-chart-visualization"
    >
      {data.interactive ? <LineSummary data={data} /> : null}
      <ChartContainer
        className="aspect-auto h-full min-h-0 w-full"
        config={chartConfig}
      >
        <LineChart
          accessibilityLayer
          data={data.data}
          margin={{ left: 0, right: 8 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey={data.indexKey}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis axisLine={false} tickLine={false} tickMargin={8} width={36} />
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
            <Line
              dataKey={series.key}
              dot={getDot(data, series.key)}
              isAnimationActive={false}
              key={series.key}
              stroke={`var(--color-${series.key})`}
              strokeWidth={2}
              type={data.curveType ?? "monotone"}
            >
              {data.showLabels ? (
                <LabelList
                  className="fill-foreground"
                  dataKey={series.key}
                  fontSize={12}
                  formatter={
                    data.customLabels
                      ? (value: unknown) => `${Number(value ?? 0)}k`
                      : undefined
                  }
                  position="top"
                />
              ) : null}
            </Line>
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function LineSummary({ data }: { data: LineChartCardData }) {
  return (
    <div className="grid grid-cols-2 rounded-md border border-border text-xs">
      {data.series.slice(0, 2).map((series, index) => (
        <div
          className={index === 0 ? "border-r border-border p-3" : "p-3"}
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

function getDot(data: LineChartCardData, key: string) {
  if (!data.showDots) {
    return false;
  }

  if (data.customDots) {
    return {
      fill: "var(--background)",
      r: 5,
      stroke: `var(--color-${key})`,
      strokeWidth: 2,
    };
  }

  if (data.colorDots) {
    return {
      fill: `var(--color-${key})`,
      r: 4,
      strokeWidth: 0,
    };
  }

  return {
    fill: "var(--background)",
    r: 3,
  };
}

function sumSeries(data: LineChartCardData, key: string) {
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

export { LineChartVisualization };
