import { type PanelDashboardConfig } from "@gridframe/core";
import { Badge } from "@gridframe/ui/badge";
import { cn } from "@gridframe/ui/utils";

import { DashboardCard } from "./dashboard-card";

type DashboardShellProps = {
  config: PanelDashboardConfig;
  className?: string;
};

function DashboardShell({ config, className }: DashboardShellProps) {
  return (
    <section
      aria-labelledby="panel-dashboard-title"
      className={cn("min-h-svh bg-background text-foreground", className)}
      data-slot="panel-dashboard"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="muted">Gridframe dashboard</Badge>
            <div className="space-y-2">
              <h1
                className="text-2xl font-semibold tracking-tight sm:text-3xl"
                id="panel-dashboard-title"
              >
                {config.title}
              </h1>
              {config.description ? (
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {config.description}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {config.cards.map((card) => (
            <DashboardCard
              card={card}
              className={getCardSpanClassName(card.visualization)}
              key={card.id}
            />
          ))}
        </div>

        {config.footer ? (
          <footer className="flex flex-wrap items-center gap-2 border-t border-border pt-5 text-sm text-muted-foreground">
            {config.footer.href ? (
              <a
                className="font-medium text-primary underline-offset-4 hover:underline"
                href={config.footer.href}
              >
                {config.footer.text}
              </a>
            ) : (
              <span>{config.footer.text}</span>
            )}
          </footer>
        ) : null}
      </div>
    </section>
  );
}

function getCardSpanClassName(visualization: string) {
  if (visualization === "metric") {
    return "xl:col-span-1";
  }

  return "md:col-span-2";
}

export { DashboardShell };
