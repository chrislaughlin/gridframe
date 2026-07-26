import { Badge } from "../internal/ui";
import { type MetricCardData } from "../types";

type MetricVisualizationProps = {
  data: MetricCardData;
};

function MetricVisualization({ data }: MetricVisualizationProps) {
  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col justify-center gap-4 overflow-hidden"
      data-slot="metric-visualization"
      style={{ containerType: "inline-size" }}
    >
      <div className="space-y-2">
        {data.label ? (
          <p className="text-sm leading-none text-muted-foreground">
            {data.label}
          </p>
        ) : null}
        <p
          className={`break-words font-semibold tracking-tight text-foreground ${
            data.label ? "text-3xl" : "text-4xl"
          }`}
          style={{
            fontSize: data.label
              ? "clamp(1.5rem, 10cqw, 1.875rem)"
              : "clamp(1.75rem, 10cqw, 2.25rem)",
            lineHeight: 1.1,
          }}
        >
          {data.value}
        </p>
      </div>
      {data.trend || data.helperText ? (
        <div className="flex flex-wrap items-center gap-2">
          {data.trend ? (
            <Badge
              variant={
                data.trend.direction === "neutral" ? "muted" : "secondary"
              }
            >
              {data.trend.value}
            </Badge>
          ) : null}
          {data.helperText ? (
            <p className="text-sm text-muted-foreground">{data.helperText}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { MetricVisualization };
