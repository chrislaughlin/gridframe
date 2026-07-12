import Link from "next/link";
import type { Metadata } from "next";
import { HeroShowcase } from "./components/hero-showcase";
import { examples } from "./data/examples";
import { CardVisualization } from "@gridframe/react";

export const metadata: Metadata = {
  title: "Gridframe: Dashboard infrastructure for product teams",
  description:
    "A toolkit for building complex, customisable dashboards without rebuilding the same dashboard plumbing every time.",
};

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium text-primary">
            Open source dashboard framework
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Stop rebuilding
            <br />
            dashboard plumbing
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-7 text-muted-foreground">
            Gridframe gives you the schemas, server handlers, and React
            components to ship user-configurable dashboards as a product
            feature. Static or API-managed, type-safe end to end.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              href="/examples"
            >
              View examples
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              href="/dashboard"
            >
              Try the dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <HeroShowcase />
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-12">
            <Feature
              description="Pass a config object and get a working dashboard. No backend required. Perfect for admin panels, reporting pages, and embedded views."
              title="Static mode"
            />
            <Feature
              description="Connect to a server API for saved layouts, user-owned dashboards, card libraries, and mediated data resolution. The full product experience."
              title="API-managed mode"
            />
            <Feature
              description="Zod schemas at the core validate every payload. The typed client catches errors at compile time. No runtime surprises."
              title="Type-safe end to end"
            />
          </div>
          <div className="space-y-12">
            <Feature
              description="Metric, area, bar, line, pie, radar, radial, and table. Each with type-safe payloads, shared validation, and consistent interaction patterns."
              title="Eight visualisation types"
            />
            <Feature
              description="Server handlers are Fetch-native Request/Response functions. Works with Next.js, Express, Hono, TanStack Start, or any Fetch-compatible runtime."
              title="Framework-neutral server"
            />
            <Feature
              description="Users browse a trusted card library, add visualisations with first-fit placement, and remove them. All operations are transactional with revision-conflict detection."
              title="Card library with revision control"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function VisualizationShowcase() {
  const featured = [
    examples.find((e) => e.slug === "bar")!,
    examples.find((e) => e.slug === "area")!,
    examples.find((e) => e.slug === "line")!,
    examples.find((e) => e.slug === "pie")!,
  ];

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Every chart type, one API
          </h2>
          <p className="mt-3 text-muted-foreground">
            Eight visualisation types with consistent series, tooltip, and
            interaction patterns. Swap types by changing one field.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {featured.map((example) => (
            <div
              className="flex min-h-64 flex-col overflow-hidden rounded-lg border border-border bg-card"
              key={example.slug}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <span className="text-sm font-medium text-card-foreground">
                  {example.title}
                </span>
                <Link
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  href={`/examples/${example.slug}`}
                >
                  View all options
                </Link>
              </div>
              <div className="flex flex-1 flex-col overflow-hidden p-4">
                <CardVisualization data={example.data} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            href="/examples"
          >
            View all 8 types
          </Link>
        </div>
      </div>
    </section>
  );
}

function CodeExample() {
  const code = `import { PanelDashboard } from "@gridframe/react";

const config = {
  title: "Sales Overview",
  cards: [
    {
      id: "revenue",
      name: "Total Revenue",
      layout: { x: 0, y: 0, width: 1, height: 2 },
      query: "/api/cards/revenue",
      visualization: "metric",
    },
    {
      id: "chart",
      name: "By Region",
      layout: { x: 1, y: 0, width: 3, height: 4 },
      query: "/api/cards/regions",
      visualization: "bar",
    },
  ],
};

export default function Dashboard() {
  return <PanelDashboard config={config} />;
}`;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Five lines to a working dashboard
            </h2>
            <p className="max-w-md text-muted-foreground">
              Define a config, pass it to the component, import the CSS.
              Drag-and-resize, card library, and persistence work out of the
              box.
            </p>
            <div className="flex gap-3 pt-2">
              <code className="inline-flex h-8 items-center rounded-md border border-border bg-muted px-3 text-xs text-muted-foreground">
                pnpm add @gridframe/core @gridframe/react
              </code>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-[#0d1117]">
            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="text-xs text-muted-foreground">
                app/dashboard/page.tsx
              </span>
            </div>
            <pre className="overflow-x-auto p-4 text-[13px] leading-5 text-[#c9d1d9]">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  const packages = [
    {
      description: "Zod schemas, types, constants. Zero framework deps.",
      name: "@gridframe/core",
    },
    {
      description: "Typed HTTP client with Zod-validated responses.",
      name: "@gridframe/client",
    },
    {
      description: "Fetch-native server handlers for any framework.",
      name: "@gridframe/server",
    },
    {
      description: "React dashboard components. Owns its own query client.",
      name: "@gridframe/react",
    },
  ];

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Four packages, one coherent stack
          </h2>
          <p className="mt-3 text-muted-foreground">
            Each package does one thing well. Compose the ones you need.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => (
            <div
              className="rounded-lg border border-border bg-card p-5"
              key={pkg.name}
            >
              <code className="text-sm font-medium text-primary">
                {pkg.name}
              </code>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">
                {pkg.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="rounded-xl border border-border bg-card p-8 sm:p-12">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Ship your first dashboard this afternoon
            </h2>
            <p className="mt-3 text-muted-foreground">
              Install the packages, define a card library, mount the server
              handlers. The drag-and-drop grid, card library, revision control,
              and loading states come free.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                href="/examples"
              >
                Browse examples
              </Link>
              <code className="inline-flex h-10 items-center rounded-md border border-border bg-muted px-4 text-xs text-muted-foreground">
                pnpm add @gridframe/core @gridframe/react
              </code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Home() {
  return (
    <>
      <Hero />
      <DashboardPreview />
      <Features />
      <VisualizationShowcase />
      <CodeExample />
      <Architecture />
      <CallToAction />
    </>
  );
}

export default Home;
