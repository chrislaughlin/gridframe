import {
  Alert,
  AlertDescription,
  AlertTitle,
  Empty,
  EmptyDescription,
  EmptyTitle,
  Skeleton,
} from "./internal/ui";

type DashboardCardStateProps =
  | {
      state: "loading";
    }
  | {
      state: "empty" | "error";
      title: string;
      message: string;
    };

function DashboardCardState(props: DashboardCardStateProps) {
  if (props.state === "loading") {
    return (
      <div className="space-y-4" data-slot="dashboard-card-loading">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-36 w-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-3" />
          <Skeleton className="h-3" />
          <Skeleton className="h-3" />
        </div>
      </div>
    );
  }

  if (props.state === "empty") {
    return (
      <Empty>
        <EmptyTitle>{props.title}</EmptyTitle>
        <EmptyDescription>{props.message}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>{props.title}</AlertTitle>
      <AlertDescription>{props.message}</AlertDescription>
    </Alert>
  );
}

export { DashboardCardState };
