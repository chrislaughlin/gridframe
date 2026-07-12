import Link from "next/link";
import type { Metadata } from "next";
import { examples } from "../data/examples";
import { CardVisualization } from "@gridframe/react";

export const metadata: Metadata = {
  title: "Examples | Gridframe",
  description:
    "Interactive examples of every Gridframe visualisation type. Metric, bar, area, line, pie, radar, radial, and table.",
};

export default function ExamplesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Examples
        </h1>
        <p className="mt-3 text-muted-foreground">
          Every visualisation type rendered with real data. Each example shows
          the payload config that produces it.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {examples.map((example) => (
          <Link
            className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/40"
            href={`/examples/${example.slug}`}
            key={example.slug}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-sm font-medium text-card-foreground">
                {example.title}
              </span>
              <span className="text-xs text-muted-foreground transition-colors group-hover:text-primary">
                View example
              </span>
            </div>
            <div className="flex min-h-56 flex-1 flex-col overflow-hidden p-4">
              <CardVisualization data={example.data} />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-card-foreground">
          Want the full dashboard experience?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The interactive dashboard includes drag-and-resize, card library,
          revision control, and API-managed persistence.
        </p>
        <Link
          className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          href="/dashboard"
        >
          Open the dashboard
        </Link>
      </div>
    </section>
  );
}
