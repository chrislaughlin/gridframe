"use client";

import { type BarChartCardData } from "@gridframe/core";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@gridframe/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

type BarChartVisualizationProps = {
  data: BarChartCardData;
};

function BarChartVisualization({ data }: BarChartVisualizationProps) {
  // TODO: Allow user-configurable series labels and colors to override this response-owned metadata.
  const chartConfig = Object.fromEntries(
    data.series.map((series) => [
      series.key,
      { label: series.label, color: series.color },
    ]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer className="h-64 w-full" config={chartConfig}>
      <BarChart accessibilityLayer data={data.data} margin={{ left: 0, right: 8 }}>
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
          <Bar
            dataKey={series.key}
            fill={`var(--color-${series.key})`}
            key={series.key}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

export { BarChartVisualization };
