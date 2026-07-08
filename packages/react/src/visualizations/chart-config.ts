import { type ChartConfig } from "../internal/ui";
import { type ChartSeries } from "../types";

function getChartConfig(series: ChartSeries[]) {
  return Object.fromEntries(
    series.map((item) => [
      item.key,
      { label: item.label, color: item.color, icon: item.icon },
    ]),
  ) satisfies ChartConfig;
}

function getSeriesByKey(series: ChartSeries[]) {
  return new Map(series.map((item) => [item.key, item]));
}

export { getChartConfig, getSeriesByKey };
