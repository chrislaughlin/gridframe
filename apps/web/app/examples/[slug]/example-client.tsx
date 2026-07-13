"use client";

import Link from "next/link";
import { CardVisualization } from "@gridframe/react";
import type { ExampleDefinition } from "../../data/examples";

function ExampleClient({ example }: { example: ExampleDefinition }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <Link
        className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        href="/examples"
      >
        <svg
          aria-hidden="true"
          className="mr-1 size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="M15 19l-7-7 7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        All examples
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {example.title}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          {example.description}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-medium text-card-foreground">
              Live preview
            </span>
            <span className="text-xs text-muted-foreground">
              {example.visualization}
            </span>
          </div>
          <div className="flex h-72 flex-col overflow-hidden p-6">
            <CardVisualization data={example.data} />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-[#0d1117]">
          <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="text-xs text-muted-foreground">
              PanelCardPayload
            </span>
          </div>
          <pre className="overflow-x-auto p-4 text-[13px] leading-5 text-[#c9d1d9]">
            <code>{example.code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

export { ExampleClient };
