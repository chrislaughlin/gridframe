// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "./theme-provider";
import { ThemeBuilder } from "./theme-builder";

vi.mock("@gridframe/react", async (importOriginal) => {
  const original = await importOriginal<typeof import("@gridframe/react")>();
  return {
    ...original,
    CardVisualization: ({ data }: { data: { visualization: string } }) => (
      <div>{data.visualization} preview</div>
    ),
  };
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn() })),
  );
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ThemeBuilder", () => {
  it("blocks activation until the Theme foundation passes accessibility checks", () => {
    render(
      <ThemeProvider>
        <ThemeBuilder />
      </ThemeProvider>,
    );

    const useTheme = screen.getByRole("button", { name: "Save and use theme" });
    expect(useTheme).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Text hex color"), {
      target: { value: "#ffffff" },
    });

    expect(useTheme).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("accessibility issue");
  });

  it("saves a named Custom theme and exposes portable output", () => {
    render(
      <ThemeProvider>
        <ThemeBuilder />
      </ThemeProvider>,
    );

    fireEvent.change(screen.getByLabelText("Theme name"), {
      target: { value: "Harbour lights" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save and use theme" }));

    expect(
      screen.getByText("Harbour lights is now active."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy JSON" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Copy CSS" })).toBeEnabled();
  });

  it("requires six-digit hex input and durably autosaves the tab draft", () => {
    render(
      <ThemeProvider>
        <ThemeBuilder />
      </ThemeProvider>,
    );

    fireEvent.change(screen.getByLabelText("Primary hex color"), {
      target: { value: "blue" },
    });

    expect(
      screen.getByRole("button", { name: "Save and use theme" }),
    ).toBeDisabled();
    expect(
      screen.getByText(/Primary must use a six-digit hex value/),
    ).toBeInTheDocument();
    expect(
      [...Array(localStorage.length).keys()]
        .map((index) => localStorage.key(index))
        .some((key) => key?.startsWith("gridframe.theme.draft.v1:")),
    ).toBe(true);
    const draftKey = [...Array(localStorage.length).keys()]
      .map((index) => localStorage.key(index))
      .find((key) => key?.startsWith("gridframe.theme.draft.v1:"));
    expect(localStorage.getItem(draftKey!)).toContain('"primary":"blue"');
  });
});
