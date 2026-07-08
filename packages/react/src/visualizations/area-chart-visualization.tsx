"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../internal/ui";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { type AreaChartCardData } from "../types";
import { getChartConfig } from "./chart-config";

type AreaChartVisualizationProps = {
  data: AreaChartCardData;
};

function AreaChartVisualization({ data }: AreaChartVisualizationProps) {
  const chartConfig = getChartConfig(data.series);

  return (
    <ChartContainer className="h-64 w-full" config={chartConfig}>
      <AreaChart
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
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        {data.series.map((series) => (
          <Area
            dataKey={series.key}
            fill={`var(--color-${series.key})`}
            fillOpacity={0.22}
            isAnimationActive={false}
            key={series.key}
            stackId="area"
            stroke={`var(--color-${series.key})`}
            strokeWidth={2}
            type="natural"
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}

export { AreaChartVisualization };
