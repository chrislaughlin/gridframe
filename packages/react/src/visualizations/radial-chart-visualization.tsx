"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../internal/ui";
import { PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { type ChartDatum, type RadialChartCardData } from "../types";
import { getChartConfig, getSeriesByKey } from "./chart-config";

type RadialChartVisualizationProps = {
  data: RadialChartCardData;
};

function RadialChartVisualization({ data }: RadialChartVisualizationProps) {
  const chartConfig = getChartConfig(data.series);
  const seriesByKey = getSeriesByKey(data.series);
  const chartData = data.data.map((datum) => {
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
        barSize={18}
        data={chartData}
        endAngle={-270}
        innerRadius={32}
        outerRadius={104}
        startAngle={90}
      >
        <PolarRadiusAxis axisLine={false} tick={false} tickLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        <RadialBar
          background
          cornerRadius={10}
          dataKey={data.valueKey}
          isAnimationActive={false}
        />
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

export { RadialChartVisualization };
