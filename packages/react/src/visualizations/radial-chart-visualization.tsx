"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../internal/ui";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import {
  type ChartDatum,
  type ChartTooltipOptions,
  type RadialChartCardData,
} from "../types";
import { getChartConfig, getSeriesByKey } from "./chart-config";

type RadialChartVisualizationProps = {
  data: RadialChartCardData;
};

function RadialChartVisualization({ data }: RadialChartVisualizationProps) {
  const chartConfig = getChartConfig(data.series);
  const seriesByKey = getSeriesByKey(data.series);
  const chartData = data.stacked
    ? data.data
    : data.data.map((datum) => {
        const series = getDatumSeries(datum, data.nameKey, seriesByKey);

        return {
          ...datum,
          fill: series ? `var(--color-${series.key})` : "var(--muted)",
        };
      });

  return (
    <ChartContainer className="h-64 w-full" config={chartConfig}>
      <RadialBarChart
        accessibilityLayer
        barSize={data.stacked ? 24 : 18}
        data={chartData}
        endAngle={-270}
        innerRadius={data.showGrid || data.centerText ? 48 : 32}
        outerRadius={104}
        startAngle={90}
      >
        <PolarRadiusAxis axisLine={false} tick={false} tickLine={false} />
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
        {data.stacked ? (
          data.series.map((series) => (
            <RadialBar
              background
              cornerRadius={data.shape === "square" ? 0 : 10}
              dataKey={series.key}
              fill={`var(--color-${series.key})`}
              isAnimationActive={false}
              key={series.key}
              stackId="radial"
            />
          ))
        ) : (
          <RadialBar
            background={data.showGrid ?? true}
            cornerRadius={data.shape === "square" ? 0 : 10}
            dataKey={data.valueKey}
            isAnimationActive={false}
            label={
              data.showLabel
                ? {
                    fill: "var(--foreground)",
                    fontSize: 12,
                    position: "insideStart",
                  }
                : false
            }
          />
        )}
        {data.centerText ? (
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                return null;
              }

              return (
                <text
                  dominantBaseline="middle"
                  textAnchor="middle"
                  x={viewBox.cx}
                  y={viewBox.cy}
                >
                  <tspan
                    className="fill-foreground text-2xl font-bold"
                    x={viewBox.cx}
                    y={viewBox.cy}
                  >
                    {data.centerText}
                  </tspan>
                  <tspan
                    className="fill-muted-foreground"
                    x={viewBox.cx}
                    y={Number(viewBox.cy) + 20}
                  >
                    Complete
                  </tspan>
                </text>
              );
            }}
          />
        ) : null}
      </RadialBarChart>
    </ChartContainer>
  );
}

function getDatumSeries(
  datum: ChartDatum,
  nameKey: string,
  seriesByKey: Map<string, { key: string; label: string; color: string }>,
) {
  const name = String(datum[nameKey] ?? "");

  return (
    seriesByKey.get(name) ??
    [...seriesByKey.values()].find((series) => series.label === name)
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

export { RadialChartVisualization };
