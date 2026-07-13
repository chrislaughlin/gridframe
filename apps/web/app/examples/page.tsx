import Link from "next/link";
import type { Metadata } from "next";
import { examples } from "../data/examples";
import { CardVisualization } from "@gridframe/react";

export const metadata: Metadata = {
  title: "Examples | Gridframe",
  description:
    "Every shadcn chart variant rendered as a Gridframe example, plus metric and table visualisations.",
};

const chartSections = [
  { key: "area", title: "Area charts" },
  { key: "bar", title: "Bar charts" },
  { key: "line", title: "Line charts" },
  { key: "pie", title: "Pie charts" },
  { key: "radar", title: "Radar charts" },
  { key: "radial", title: "Radial charts" },
] as const;

export default function ExamplesPage() {
  return (
    <section
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      id="top"
    >
      <div className="mb-10 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Examples
        </h1>
        <p className="mt-3 text-muted-foreground">
          Every chart variation from the shadcn chart catalog, rendered with a
          Gridframe payload. Open any example to inspect the complete config.
        </p>
        <nav aria-label="Chart types" className="mt-6 flex flex-wrap gap-2">
          {chartSections.map((section) => (
            <a
              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              href={`#${section.key}`}
              key={section.key}
            >
              {section.title}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-14">
        {chartSections.map((section) => {
          const sectionExamples = examples.filter(
            (example) => example.visualization === section.key,
          );

          return (
            <section id={section.key} key={section.key}>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {section.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {sectionExamples.length} shadcn variants
                  </p>
                </div>
                <a
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  href="#top"
                >
                  Back to top
                </a>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {sectionExamples.map((example) => (
                  <ExampleCard example={example} key={example.slug} />
                ))}
              </div>
            </section>
          );
        })}

        <section id="other">
          <div className="mb-5">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              More visualisations
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gridframe payloads beyond the shadcn chart catalog
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {examples
              .filter((example) =>
                ["metric", "table"].includes(example.visualization),
              )
              .map((example) => (
                <ExampleCard example={example} key={example.slug} />
              ))}
          </div>
        </section>
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

function ExampleCard({ example }: { example: (typeof examples)[number] }) {
  return (
    <Link
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/40"
      href={`/examples/${example.slug}`}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-sm font-medium text-card-foreground">
          {example.title}
        </span>
        <span className="text-xs text-muted-foreground transition-colors group-hover:text-primary">
          View example
        </span>
      </div>
      <div className="flex h-64 flex-col overflow-hidden p-4">
        <CardVisualization data={example.data} />
      </div>
    </Link>
  );
}
