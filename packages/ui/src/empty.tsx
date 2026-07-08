import { type ComponentProps } from "react";

import { cn } from "./utils";

function Empty({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/25 p-6 text-center",
        className,
      )}
      data-slot="empty"
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm font-medium text-foreground", className)}
      data-slot="empty-title"
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("mt-1 max-w-sm text-sm text-muted-foreground", className)}
      data-slot="empty-description"
      {...props}
    />
  );
}

export { Empty, EmptyDescription, EmptyTitle };
