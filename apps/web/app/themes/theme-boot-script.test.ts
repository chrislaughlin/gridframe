// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { darkTheme, lightTheme } from "@gridframe/react/theme";

import { themeBootScript, themeValidationHash } from "./theme-boot-script";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("style");
  document.documentElement.removeAttribute("data-theme");
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false })),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("Theme first paint", () => {
  it("applies the stored Theme before the app hydrates", () => {
    localStorage.setItem("gridframe.theme.selection.v1", "dark");

    window.eval(themeBootScript);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(
      document.documentElement.style.getPropertyValue("--background"),
    ).toBe(darkTheme.colors.background);
  });

  it("falls back to the system-derived preset when storage is corrupt", () => {
    localStorage.setItem("gridframe.theme.selection.v1", "custom");
    localStorage.setItem("gridframe.theme.custom.v1", "{not-json");

    window.eval(themeBootScript);

    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("rejects a structurally incomplete Custom theme at first paint", () => {
    localStorage.setItem("gridframe.theme.selection.v1", "custom");
    localStorage.setItem(
      "gridframe.theme.custom.v1",
      JSON.stringify({
        version: 1,
        name: "Incomplete",
        foundation: {},
        theme: {
          name: "Incomplete",
          colorScheme: "dark",
          contrast: "standard",
          colors: { background: "#000000" },
        },
      }),
    );

    window.eval(themeBootScript);

    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("applies only a semantically validated Custom theme envelope", () => {
    const foundation = {
      background: "#f8fafc",
      surface: "#ffffff",
      text: "#111827",
      primary: "#1d4ed8",
      accent: "#0f766e",
      destructive: "#b91c1c",
    };
    const custom = { ...lightTheme, name: "Verified" };
    localStorage.setItem("gridframe.theme.selection.v1", "custom");
    localStorage.setItem(
      "gridframe.theme.custom.v1",
      JSON.stringify({
        version: 1,
        name: "Verified",
        foundation,
        theme: custom,
        validationHash: themeValidationHash(custom),
      }),
    );

    window.eval(themeBootScript);

    expect(document.documentElement.dataset.theme).toBe("custom");
    expect(
      document.documentElement.style.getPropertyValue("--background"),
    ).toBe(lightTheme.colors.background);

    const unreadable = {
      ...custom,
      colors: Object.fromEntries(
        Object.keys(custom.colors).map((key) => [key, "#ffffff"]),
      ),
    };
    localStorage.setItem(
      "gridframe.theme.custom.v1",
      JSON.stringify({
        version: 1,
        name: "Corrupt",
        foundation,
        theme: unreadable,
      }),
    );
    document.documentElement.removeAttribute("style");
    window.eval(themeBootScript);

    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
