// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GridframeThemeScope } from "./gridframe-theme-scope";
import { darkTheme } from "./theme";

afterEach(cleanup);

describe("GridframeThemeScope", () => {
  it("applies a valid Theme to its subtree", () => {
    render(
      <GridframeThemeScope theme={darkTheme}>
        <p>Scoped Dashboard</p>
      </GridframeThemeScope>,
    );

    const scope = screen.getByText("Scoped Dashboard").parentElement;
    expect(scope).toHaveAttribute("data-gridframe-theme", "dark");
    expect(scope).toHaveStyle({
      "--background": darkTheme.colors.background,
      "--chart-5": darkTheme.colors.chart5,
      colorScheme: "dark",
    });
  });

  it("keeps the inherited Theme when a supplied Theme is malformed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const malformed = {
      ...darkTheme,
      colors: { ...darkTheme.colors, primary: "definitely-not-a-color" },
    };

    render(
      <GridframeThemeScope theme={malformed}>
        <p>Inherited Dashboard</p>
      </GridframeThemeScope>,
    );

    const scope = screen.getByText("Inherited Dashboard").parentElement;
    expect(scope).not.toHaveAttribute("style");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("received an invalid Theme"),
    );
  });
});
