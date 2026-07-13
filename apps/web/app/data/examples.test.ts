import { PanelCardPayloadSchema } from "@gridframe/core";
import { describe, expect, it } from "vitest";
import { examples, getExample } from "./examples";

const shadcnChartSlugs = [
  "chart-area-interactive",
  "chart-area-default",
  "chart-area-linear",
  "chart-area-step",
  "chart-area-legend",
  "chart-area-stacked",
  "chart-area-stacked-expand",
  "chart-area-icons",
  "chart-area-gradient",
  "chart-area-axes",
  "chart-bar-interactive",
  "chart-bar-default",
  "chart-bar-horizontal",
  "chart-bar-multiple",
  "chart-bar-stacked",
  "chart-bar-label",
  "chart-bar-label-custom",
  "chart-bar-mixed",
  "chart-bar-active",
  "chart-bar-negative",
  "chart-line-interactive",
  "chart-line-default",
  "chart-line-linear",
  "chart-line-step",
  "chart-line-multiple",
  "chart-line-dots",
  "chart-line-dots-custom",
  "chart-line-dots-colors",
  "chart-line-label",
  "chart-line-label-custom",
  "chart-pie-simple",
  "chart-pie-separator-none",
  "chart-pie-label",
  "chart-pie-label-custom",
  "chart-pie-label-list",
  "chart-pie-legend",
  "chart-pie-donut",
  "chart-pie-donut-active",
  "chart-pie-donut-text",
  "chart-pie-stacked",
  "chart-pie-interactive",
  "chart-radar-default",
  "chart-radar-dots",
  "chart-radar-lines-only",
  "chart-radar-label-custom",
  "chart-radar-grid-custom",
  "chart-radar-grid-none",
  "chart-radar-grid-circle",
  "chart-radar-grid-circle-no-lines",
  "chart-radar-grid-circle-fill",
  "chart-radar-grid-fill",
  "chart-radar-multiple",
  "chart-radar-legend",
  "chart-radial-simple",
  "chart-radial-label",
  "chart-radial-grid",
  "chart-radial-text",
  "chart-radial-shape",
  "chart-radial-stacked",
];

describe("examples catalog", () => {
  it("covers every shadcn chart variant exactly once", () => {
    const chartExamples = examples.filter((example) =>
      example.slug.startsWith("chart-"),
    );

    expect(chartExamples.map((example) => example.slug).sort()).toEqual(
      [...shadcnChartSlugs].sort(),
    );
  });

  it("contains valid payloads and unique slugs", () => {
    expect(new Set(examples.map((example) => example.slug)).size).toBe(
      examples.length,
    );

    for (const example of examples) {
      expect(() => PanelCardPayloadSchema.parse(example.data)).not.toThrow();
    }
  });

  it("keeps the original chart routes as aliases", () => {
    expect(getExample("area")?.slug).toBe("chart-area-default");
    expect(getExample("bar")?.slug).toBe("chart-bar-default");
    expect(getExample("line")?.slug).toBe("chart-line-default");
    expect(getExample("pie")?.slug).toBe("chart-pie-donut");
    expect(getExample("radar")?.slug).toBe("chart-radar-dots");
    expect(getExample("radial")?.slug).toBe("chart-radial-label");
  });
});
