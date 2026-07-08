import { Badge } from "../internal/ui";
import { type MetricCardData } from "../types";

type MetricVisualizationProps = {
  data: MetricCardData;
};

function MetricVisualization({ data }: MetricVisualizationProps) {
  return (
    <div className="flex min-h-40 flex-col justify-end gap-4">
      <div className="space-y-2">
        {data.label ? (
          <p className="text-sm text-muted-foreground">{data.label}</p>
        ) : null}
        <p className="text-4xl font-semibold tracking-tight text-foreground">
          {data.value}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {data.trend ? (
          <Badge variant={data.trend.direction === "neutral" ? "muted" : "secondary"}>
            {data.trend.value}
          </Badge>
        ) : null}
        {data.helperText ? (
          <p className="text-sm text-muted-foreground">{data.helperText}</p>
        ) : null}
      </div>
    </div>
  );
}

export { MetricVisualization };
