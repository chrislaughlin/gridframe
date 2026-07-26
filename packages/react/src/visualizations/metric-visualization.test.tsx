// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MetricVisualization } from "./metric-visualization";

afterEach(cleanup);

describe("MetricVisualization", () => {
  it("uses a smaller value size when a label is rendered", () => {
    render(
      <MetricVisualization
        data={{ visualization: "metric", label: "Orders", value: "47294" }}
      />,
    );

    expect(screen.getByText("47294")).toHaveClass("text-3xl");
    expect(screen.getByText("47294")).not.toHaveClass("text-4xl");
  });

  it("keeps the larger value size when no label is rendered", () => {
    render(
      <MetricVisualization
        data={{ visualization: "metric", value: "47294" }}
      />,
    );

    expect(screen.getByText("47294")).toHaveClass("text-4xl");
    expect(screen.getByText("47294")).not.toHaveClass("text-3xl");
  });
});
