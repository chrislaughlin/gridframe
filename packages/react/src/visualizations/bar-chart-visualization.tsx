"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../internal/ui";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { type BarChartCardData, type ChartTooltipOptions } from "../types";
import { getChartConfig } from "./chart-config";

type BarChartVisualizationProps = {
  data: BarChartCardData;
};

function BarChartVisualization({ data }: BarChartVisualizationProps) {
  const chartConfig = getChartConfig(data.series);
  const isHorizontal = data.layout === "horizontal";

  return (
    <ChartContainer
      className="aspect-auto h-full min-h-0 w-full"
      config={chartConfig}
    >
      <BarChart
        accessibilityLayer
        data={data.data}
        layout={isHorizontal ? "vertical" : undefined}
        margin={{ left: isHorizontal ? 12 : 0, right: 8 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          axisLine={false}
          dataKey={isHorizontal ? undefined : data.indexKey}
          tickLine={false}
          tickMargin={8}
          type={isHorizontal ? "number" : "category"}
        />
        <YAxis
          axisLine={false}
          dataKey={isHorizontal ? data.indexKey : undefined}
          tickLine={false}
          tickMargin={8}
          type={isHorizontal ? "category" : "number"}
          width={isHorizontal ? 72 : 36}
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
              labelFormatter={
                data.tooltip?.label
                  ? () => data.tooltip?.label
                  : getLabelFormatter(data.tooltip?.labelFormatter)
              }
            />
          }
          cursor={false}
        />
        {data.series.map((series) => (
          <Bar
            dataKey={series.key}
            fill={`var(--color-${series.key})`}
            isAnimationActive={false}
            key={series.key}
            radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            stackId={data.stacked ? "bar" : undefined}
          >
            {data.activeIndex !== undefined || data.mixed
              ? data.data.map((datum, index) => (
                  <Cell
                    fill={
                      data.mixed
                        ? `var(--chart-${(index % 5) + 1})`
                        : `var(--color-${series.key})`
                    }
                    fillOpacity={
                      data.activeIndex === undefined ||
                      data.activeIndex === index
                        ? 1
                        : 0.35
                    }
                    key={`${series.key}-${String(datum[data.indexKey])}`}
                  />
                ))
              : null}
            {data.showLabels ? (
              <LabelList
                className="fill-foreground"
                dataKey={series.key}
                fontSize={12}
                formatter={
                  data.customLabels
                    ? (value: unknown) =>
                        `${Number(value ?? 0).toLocaleString()} visits`
                    : undefined
                }
                position={isHorizontal ? "right" : "top"}
              />
            ) : null}
          </Bar>
        ))}
      </BarChart>
    </ChartContainer>
  );
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

export { BarChartVisualization };
