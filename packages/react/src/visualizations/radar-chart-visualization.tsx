"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../internal/ui";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { type RadarChartCardData } from "../types";
import { getChartConfig } from "./chart-config";

type RadarChartVisualizationProps = {
  data: RadarChartCardData;
};

function RadarChartVisualization({ data }: RadarChartVisualizationProps) {
  const chartConfig = getChartConfig(data.series);

  return (
    <ChartContainer className="h-64 w-full" config={chartConfig}>
      <RadarChart accessibilityLayer data={data.data}>
        <PolarGrid gridType="circle" />
        <PolarAngleAxis dataKey={data.indexKey} tickLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        {data.series.map((series) => (
          <Radar
            dataKey={series.key}
            fill={`var(--color-${series.key})`}
            fillOpacity={0.22}
            isAnimationActive={false}
            key={series.key}
            stroke={`var(--color-${series.key})`}
            strokeWidth={2}
          />
        ))}
      </RadarChart>
    </ChartContainer>
  );
}

export { RadarChartVisualization };
