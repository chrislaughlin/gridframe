// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "./theme-provider";
import { ThemeSwitcher } from "./theme-switcher";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn() })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ThemeSwitcher", () => {
  it("lets a user select each Theme preset and reach the Theme Builder", () => {
    render(createElement(ThemeProvider, null, createElement(ThemeSwitcher)));

    const select = screen.getByRole("combobox", { name: "Theme" });
    expect(select).toHaveValue("light");

    fireEvent.change(select, { target: { value: "high-contrast" } });
    expect(select).toHaveValue("high-contrast");
    expect(document.documentElement.dataset.theme).toBe("high-contrast");
    expect(screen.getByRole("link", { name: "Build a theme" })).toHaveAttribute(
      "href",
      "/themes",
    );
  });
});
