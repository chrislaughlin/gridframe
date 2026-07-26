// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { act, cleanup, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { darkTheme, lightTheme } from "@gridframe/react/theme";
import {
  CUSTOM_THEME_STORAGE_KEY,
  THEME_SELECTION_STORAGE_KEY,
  ThemeProvider,
  useTheme,
} from "./theme-provider";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(ThemeProvider, null, children);
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("style");
  document.documentElement.removeAttribute("data-theme");
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn() })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ThemeProvider", () => {
  it("uses the system preference until a user selects a Theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.selection).toBe("light");
    act(() => result.current.selectTheme("dark"));

    expect(localStorage.getItem(THEME_SELECTION_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement).toHaveStyle({
      "--background": darkTheme.colors.background,
    });
  });

  it("saves and activates one valid Custom theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    const saved = {
      name: "Harbour",
      foundation: {
        background: "#f8fafc",
        surface: "#ffffff",
        text: "#111827",
        primary: "#1d4ed8",
        accent: "#0f766e",
        destructive: "#b91c1c",
      },
      theme: { ...lightTheme, name: "Harbour" },
    };

    act(() => result.current.saveAndUseCustomTheme(saved));

    expect(result.current.selection).toBe("custom");
    expect(result.current.customTheme?.name).toBe("Harbour");
    expect(
      JSON.parse(localStorage.getItem(CUSTOM_THEME_STORAGE_KEY)!),
    ).toMatchObject({ version: 1, name: "Harbour" });
  });

  it("deletes Custom state and falls back to the system-derived preset", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() =>
      result.current.saveAndUseCustomTheme({
        name: "Temporary",
        foundation: {
          background: "#f8fafc",
          surface: "#ffffff",
          text: "#111827",
          primary: "#1d4ed8",
          accent: "#0f766e",
          destructive: "#b91c1c",
        },
        theme: { ...lightTheme, name: "Temporary" },
      }),
    );

    act(() => result.current.deleteCustomTheme());

    expect(result.current.selection).toBe("light");
    expect(result.current.customTheme).toBeUndefined();
    expect(localStorage.getItem(CUSTOM_THEME_STORAGE_KEY)).toBeNull();
  });
});
