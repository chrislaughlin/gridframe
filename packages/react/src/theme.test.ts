import { describe, expect, it } from "vitest";

import {
  createGridframeTheme,
  darkTheme,
  highContrastTheme,
  lightTheme,
  serializeGridframeTheme,
  themeToCssVariables,
  validateGridframeTheme,
} from "./theme";

describe("Gridframe Theme presets", () => {
  it("provides complete, valid Light, Dark, and High Contrast presets", () => {
    for (const theme of [lightTheme, darkTheme, highContrastTheme]) {
      expect(Object.keys(theme.colors)).toHaveLength(24);
      expect(validateGridframeTheme(theme).valid).toBe(true);
    }
    expect(validateGridframeTheme(highContrastTheme, 7).valid).toBe(true);

    expect(darkTheme.colors.background).toBe("oklch(0.18 0.018 255)");
    expect(highContrastTheme.colors.ring).toBe("oklch(0.9 0.19 100)");
  });
});

describe("Custom theme generation", () => {
  it("reports a malformed runtime value without throwing", () => {
    expect(validateGridframeTheme({ name: "Broken" })).toMatchObject({
      valid: false,
      issues: expect.arrayContaining([
        expect.objectContaining({
          path: "colors",
          code: "invalid-theme",
        }),
      ]),
    });
  });

  it("returns structured issues for null, partial, and non-string foundations", () => {
    for (const foundation of [
      null,
      { background: "#ffffff" },
      { background: 42 },
    ]) {
      expect(() => createGridframeTheme(foundation)).not.toThrow();
      expect(createGridframeTheme(foundation)).toMatchObject({
        valid: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: expect.stringMatching(/^invalid-/) }),
        ]),
      });
    }
    expect(() =>
      createGridframeTheme(
        {
          background: "#f8fafc",
          surface: "#ffffff",
          text: "#111827",
          primary: "#1d4ed8",
          accent: "#0f766e",
          destructive: "#b91c1c",
        },
        null,
      ),
    ).not.toThrow();
  });

  it("generates a complete OKLCH Theme from six foundation colors", () => {
    const result = createGridframeTheme(
      {
        background: "#f8fafc",
        surface: "#ffffff",
        text: "#111827",
        primary: "#1d4ed8",
        accent: "#0f766e",
        destructive: "#b91c1c",
      },
      { name: "North star" },
    );

    expect(result.valid).toBe(true);
    expect(result.theme.name).toBe("North star");
    expect(result.theme.colorScheme).toBe("light");
    expect(result.theme.colors.background).toMatch(/^oklch\(/);
    expect(result.theme.colors.chart5).toMatch(/^oklch\(/);
  });

  it("returns actionable issues without silently changing invalid inputs", () => {
    const result = createGridframeTheme({
      background: "#ffffff",
      surface: "#ffffff",
      text: "#fefefe",
      primary: "not-a-color",
      accent: "#eeeeee",
      destructive: "#eeeeee",
    });

    expect(result.valid).toBe(false);
    expect(result.foundation.primary).toBe("not-a-color");
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "foundation.primary",
          code: "invalid-color",
        }),
        expect.objectContaining({
          code: "contrast",
          suggestedColor: expect.stringMatching(/^oklch\(/),
        }),
      ]),
    );
  });

  it("serializes a saved Theme as versioned JSON and CSS variables", () => {
    const json = JSON.parse(serializeGridframeTheme(darkTheme));
    expect(json).toMatchObject({
      version: 1,
      name: "Dark",
      theme: { colorScheme: "dark" },
    });

    expect(themeToCssVariables(darkTheme)).toContain(
      "--background: oklch(0.18 0.018 255);",
    );
    expect(themeToCssVariables(darkTheme)).toContain("--chart-5:");
  });
});
