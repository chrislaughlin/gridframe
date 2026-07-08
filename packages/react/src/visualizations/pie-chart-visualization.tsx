"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  cn,
} from "../internal/ui";
import { Cell, Label, LabelList, Pie, PieChart } from "recharts";
import {
  type ChartDatum,
  type ChartTooltipOptions,
  type PieChartCardData,
} from "../types";
import { getChartConfig, getSeriesByKey } from "./chart-config";

type PieChartVisualizationProps = {
  data: PieChartCardData;
};

function PieChartVisualization({ data }: PieChartVisualizationProps) {
  const chartConfig = getChartConfig(data.series);
  const seriesByKey = getSeriesByKey(data.series);

  return (
    <div className="space-y-4">
      <ChartContainer className="mx-auto h-64 w-full" config={chartConfig}>
        <PieChart accessibilityLayer>
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
          <Pie
            cx="50%"
            cy="50%"
            data={data.data}
            dataKey={data.valueKey}
            innerRadius={data.donut || data.centerText ? 48 : 0}
            isAnimationActive={false}
            label={
              data.showLabels && !data.labelList
                ? data.customLabels
                  ? ({ name, value }) => `${name}: ${value}`
                  : true
                : false
            }
            nameKey={data.nameKey}
            outerRadius={data.stacked ? 72 : 84}
            paddingAngle={data.separator ? 3 : 0}
            stroke="var(--background)"
            strokeWidth={data.separator ? 4 : 2}
          >
            {data.data.map((datum) => {
              const series = getDatumSeries(datum, data.nameKey, seriesByKey);

              return (
                <Cell
                  fill={series ? `var(--color-${series.key})` : "var(--muted)"}
                  fillOpacity={
                    data.interactive && data.activeIndex !== undefined
                      ? data.data.indexOf(datum) === data.activeIndex
                        ? 1
                        : 0.45
                      : 1
                  }
                  key={`${String(datum[data.nameKey])}-${String(
                    datum[data.valueKey],
                  )}`}
                />
              );
            })}
            {data.labelList ? (
              <LabelList
                className="fill-background"
                dataKey={data.nameKey}
                fontSize={12}
                stroke="none"
              />
            ) : null}
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
                        Total
                      </tspan>
                    </text>
                  );
                }}
              />
            ) : null}
          </Pie>
          {data.stacked ? (
            <Pie
              cx="50%"
              cy="50%"
              data={data.data}
              dataKey={data.valueKey}
              innerRadius={78}
              isAnimationActive={false}
              nameKey={data.nameKey}
              outerRadius={96}
              stroke="var(--background)"
              strokeWidth={2}
            >
              {data.data.map((datum) => {
                const series = getDatumSeries(datum, data.nameKey, seriesByKey);

                return (
                  <Cell
                    fill={
                      series ? `var(--color-${series.key})` : "var(--muted)"
                    }
                    fillOpacity={0.45}
                    key={`outer-${String(datum[data.nameKey])}`}
                  />
                );
              })}
            </Pie>
          ) : null}
        </PieChart>
      </ChartContainer>
      {(data.showLegend ?? true) ? <ChartLegend data={data} /> : null}
    </div>
  );
}

function ChartLegend({ data }: { data: PieChartCardData }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
      {data.series.map((series) => (
        <div className="flex items-center gap-2" key={series.key}>
          <span
            className={cn("size-2 rounded-[2px]")}
            style={{ backgroundColor: `var(--color-${series.key})` }}
          />
          <span className="truncate">{series.label}</span>
        </div>
      ))}
    </div>
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

export { PieChartVisualization };
