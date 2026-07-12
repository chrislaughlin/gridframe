import type {
  PanelCardPayload,
  SourceDataTable as SourceDataTableValue,
} from "./types";
import { AreaChartVisualization } from "./visualizations/area-chart-visualization";
import { BarChartVisualization } from "./visualizations/bar-chart-visualization";
import { LineChartVisualization } from "./visualizations/line-chart-visualization";
import { MetricVisualization } from "./visualizations/metric-visualization";
import { PieChartVisualization } from "./visualizations/pie-chart-visualization";
import { RadarChartVisualization } from "./visualizations/radar-chart-visualization";
import { RadialChartVisualization } from "./visualizations/radial-chart-visualization";
import { TableVisualization } from "./visualizations/table-visualization";

function CardVisualization({ data }: { data: PanelCardPayload }) {
  switch (data.visualization) {
    case "metric":
      return <MetricVisualization data={data} />;
    case "area":
      return <AreaChartVisualization data={data} />;
    case "bar":
      return <BarChartVisualization data={data} />;
    case "line":
      return <LineChartVisualization data={data} />;
    case "pie":
      return <PieChartVisualization data={data} />;
    case "radar":
      return <RadarChartVisualization data={data} />;
    case "radial":
      return <RadialChartVisualization data={data} />;
    case "table":
      return <TableVisualization data={data} />;
  }
}

function SourceDataTable({ data }: { data: SourceDataTableValue }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {data.columns.map((column) => (
              <th
                className="px-4 py-3 text-left font-medium"
                key={column.key}
                scope="col"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, index) => (
            <tr className="border-b border-border last:border-0" key={index}>
              {data.columns.map((column) => (
                <td className="px-4 py-3" key={column.key}>
                  {row[column.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { CardVisualization, SourceDataTable };
