"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../internal/ui";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { type LineChartCardData } from "../types";
import { getChartConfig } from "./chart-config";

type LineChartVisualizationProps = {
  data: LineChartCardData;
};

function LineChartVisualization({ data }: LineChartVisualizationProps) {
  const chartConfig = getChartConfig(data.series);

  return (
    <ChartContainer className="h-64 w-full" config={chartConfig}>
      <LineChart accessibilityLayer data={data.data} margin={{ left: 0, right: 8 }}>
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
          <Line
            dataKey={series.key}
            dot={false}
            isAnimationActive={false}
            key={series.key}
            stroke={`var(--color-${series.key})`}
            strokeWidth={2}
            type="monotone"
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

export { LineChartVisualization };
