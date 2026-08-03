// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PanelCardPayload, VisualizationType } from "@gridframe/core";

const renderedPayloads: PanelCardPayload[] = [];

vi.mock("./card-visualization", () => ({
  CardVisualization: ({ data }: { data: PanelCardPayload }) => {
    renderedPayloads.push(data);
    return <output data-chart-preview={data.visualization} />;
  },
}));

import { CardLibraryPreview } from "./card-library-preview";

const visualizationTypes = [
  "metric",
  "area",
  "bar",
  "line",
  "pie",
  "radar",
  "radial",
  "table",
] as const satisfies readonly VisualizationType[];

afterEach(() => {
  cleanup();
  renderedPayloads.length = 0;
  vi.unstubAllGlobals();
});

describe("CardLibraryPreview", () => {
  it("renders a fetch-free preview for every supported Visualization", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(
      <>
        {visualizationTypes.map((visualization) => (
          <CardLibraryPreview
            key={visualization}
            visualization={visualization}
          />
        ))}
      </>,
    );

    for (const visualization of visualizationTypes) {
      expect(
        container.querySelector(
          `[data-card-library-preview="${visualization}"]`,
        ),
      ).toBeInTheDocument();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses generic content for metric and table previews", () => {
    const { container } = render(
      <>
        <CardLibraryPreview visualization="metric" />
        <CardLibraryPreview visualization="table" />
      </>,
    );

    expect(container).toHaveTextContent("Total value");
    expect(container).toHaveTextContent("24.8K");
    expect(container).toHaveTextContent("Name");
    expect(container).toHaveTextContent("Alpha");
    expect(renderedPayloads).toHaveLength(0);
  });

  it("passes stable static data to every chart renderer", () => {
    const chartTypes = visualizationTypes.filter(
      (visualization) =>
        visualization !== "metric" && visualization !== "table",
    );

    const firstRender = render(
      <>
        {chartTypes.map((visualization) => (
          <CardLibraryPreview
            key={visualization}
            visualization={visualization}
          />
        ))}
      </>,
    );
    const firstPayloads = structuredClone(renderedPayloads);
    firstRender.unmount();
    renderedPayloads.length = 0;

    render(
      <>
        {chartTypes.map((visualization) => (
          <CardLibraryPreview
            key={visualization}
            visualization={visualization}
          />
        ))}
      </>,
    );

    expect(renderedPayloads.map(({ visualization }) => visualization)).toEqual(
      chartTypes,
    );
    expect(renderedPayloads).toEqual(firstPayloads);
    expect(firstPayloads).toMatchObject([
      { visualization: "area", indexKey: "period", data: expect.any(Array) },
      { visualization: "bar", indexKey: "period", data: expect.any(Array) },
      { visualization: "line", indexKey: "period", data: expect.any(Array) },
      {
        visualization: "pie",
        nameKey: "segment",
        valueKey: "value",
        data: expect.any(Array),
      },
      {
        visualization: "radar",
        indexKey: "dimension",
        data: expect.any(Array),
      },
      {
        visualization: "radial",
        nameKey: "segment",
        valueKey: "value",
        data: expect.any(Array),
      },
    ]);
    for (const payload of firstPayloads) {
      expect(payload.data.length).toBeGreaterThan(0);
    }
  });
});
