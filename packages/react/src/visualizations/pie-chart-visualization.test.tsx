// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PieChartVisualization } from "./pie-chart-visualization";

afterEach(cleanup);

describe("PieChartVisualization", () => {
  it("fills the available Card preview width", () => {
    const { container } = render(
      <PieChartVisualization
        data={{
          visualization: "pie",
          nameKey: "segment",
          valueKey: "value",
          data: [
            { segment: "Direct", value: 42 },
            { segment: "Search", value: 31 },
          ],
          series: [
            { key: "Direct", label: "Direct", color: "var(--chart-1)" },
            { key: "Search", label: "Search", color: "var(--chart-2)" },
          ],
          showLegend: false,
        }}
      />,
    );

    expect(container.firstElementChild).toHaveClass("h-full", "w-full");
  });
});
