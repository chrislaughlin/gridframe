"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  cn,
} from "../internal/ui";
import { Cell, Pie, PieChart } from "recharts";
import { type ChartDatum, type PieChartCardData } from "../types";
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
          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          <Pie
            cx="50%"
            cy="50%"
            data={data.data}
            dataKey={data.valueKey}
            innerRadius={48}
            isAnimationActive={false}
            nameKey={data.nameKey}
            outerRadius={84}
            paddingAngle={2}
            strokeWidth={2}
          >
            {data.data.map((datum) => {
              const series = getDatumSeries(datum, data.nameKey, seriesByKey);

              return (
                <Cell
                  fill={series ? `var(--color-${series.key})` : "var(--muted)"}
                  key={`${String(datum[data.nameKey])}-${String(
                    datum[data.valueKey],
                  )}`}
                />
              );
            })}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ChartLegend data={data} />
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

export { PieChartVisualization };
