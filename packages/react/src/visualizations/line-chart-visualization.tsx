"use client";

import { type LineChartCardData } from "@gridframe/core";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@gridframe/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

type LineChartVisualizationProps = {
  data: LineChartCardData;
};

function LineChartVisualization({ data }: LineChartVisualizationProps) {
  // TODO: Allow user-configurable series labels and colors to override this response-owned metadata.
  const chartConfig = Object.fromEntries(
    data.series.map((series) => [
      series.key,
      { label: series.label, color: series.color },
    ]),
  ) satisfies ChartConfig;

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
