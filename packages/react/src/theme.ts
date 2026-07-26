import {
  converter,
  formatHex,
  interpolate,
  parse,
  wcagContrast,
  wcagLuminance,
} from "culori";

const themeColorKeys = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "destructive",
  "destructiveForeground",
  "border",
  "input",
  "ring",
  "chart1",
  "chart2",
  "chart3",
  "chart4",
  "chart5",
] as const;

type GridframeThemeColor = (typeof themeColorKeys)[number];
type GridframeThemeColors = Record<GridframeThemeColor, string>;

type GridframeThemeFoundation = {
  background: string;
  surface: string;
  text: string;
  primary: string;
  accent: string;
  destructive: string;
};

type GridframeTheme = {
  name: string;
  colorScheme: "light" | "dark";
  contrast: "standard" | "high";
  colors: GridframeThemeColors;
};

type ThemeValidationIssue = {
  path: string;
  code: "invalid-theme" | "invalid-color" | "contrast" | "distinction";
  message: string;
  actual?: number;
  required?: number;
  suggestedColor?: string;
};

type ThemeAccessibilityCheck = {
  path: string;
  label: string;
  kind: "contrast" | "difference";
  actual: number;
  required: number;
  passed: boolean;
  suggestedColor?: string;
};

type ThemeValidationResult = {
  valid: boolean;
  issues: ThemeValidationIssue[];
  checks: ThemeAccessibilityCheck[];
};

type ThemeGenerationResult = ThemeValidationResult & {
  foundation: GridframeThemeFoundation;
  theme: GridframeTheme;
};

const lightTheme: GridframeTheme = {
  name: "Light",
  colorScheme: "light",
  contrast: "standard",
  colors: {
    background: "oklch(0.985 0.006 250)",
    foreground: "oklch(0.22 0.018 255)",
    card: "oklch(0.998 0.004 250)",
    cardForeground: "oklch(0.22 0.018 255)",
    popover: "oklch(0.998 0.004 250)",
    popoverForeground: "oklch(0.22 0.018 255)",
    primary: "oklch(0.47 0.14 252)",
    primaryForeground: "oklch(0.985 0.006 250)",
    secondary: "oklch(0.94 0.012 250)",
    secondaryForeground: "oklch(0.28 0.018 255)",
    muted: "oklch(0.94 0.012 250)",
    mutedForeground: "oklch(0.51 0.026 255)",
    accent: "oklch(0.91 0.035 246)",
    accentForeground: "oklch(0.28 0.06 252)",
    destructive: "oklch(0.575 0.18 25)",
    destructiveForeground: "oklch(0.985 0.006 250)",
    border: "oklch(0.88 0.015 250)",
    input: "oklch(0.88 0.015 250)",
    ring: "oklch(0.54 0.13 252)",
    chart1: "oklch(0.55 0.16 252)",
    chart2: "oklch(0.58 0.13 180)",
    chart3: "oklch(0.62 0.14 75)",
    chart4: "oklch(0.58 0.16 315)",
    chart5: "oklch(0.52 0.12 30)",
  },
};

const darkTheme: GridframeTheme = {
  name: "Dark",
  colorScheme: "dark",
  contrast: "standard",
  colors: {
    background: "oklch(0.18 0.018 255)",
    foreground: "oklch(0.93 0.012 250)",
    card: "oklch(0.22 0.02 255)",
    cardForeground: "oklch(0.93 0.012 250)",
    popover: "oklch(0.22 0.02 255)",
    popoverForeground: "oklch(0.93 0.012 250)",
    primary: "oklch(0.68 0.13 252)",
    primaryForeground: "oklch(0.18 0.018 255)",
    secondary: "oklch(0.28 0.022 255)",
    secondaryForeground: "oklch(0.91 0.012 250)",
    muted: "oklch(0.28 0.022 255)",
    mutedForeground: "oklch(0.7 0.02 250)",
    accent: "oklch(0.31 0.045 252)",
    accentForeground: "oklch(0.91 0.035 246)",
    destructive: "oklch(0.7 0.16 24)",
    destructiveForeground: "oklch(0.18 0.018 255)",
    border: "oklch(0.33 0.024 255)",
    input: "oklch(0.33 0.024 255)",
    ring: "oklch(0.68 0.13 252)",
    chart1: "oklch(0.72 0.13 252)",
    chart2: "oklch(0.68 0.12 180)",
    chart3: "oklch(0.75 0.13 75)",
    chart4: "oklch(0.74 0.14 315)",
    chart5: "oklch(0.68 0.12 30)",
  },
};

const highContrastTheme: GridframeTheme = {
  name: "High Contrast",
  colorScheme: "dark",
  contrast: "high",
  colors: {
    background: "oklch(0.04 0 0)",
    foreground: "oklch(0.98 0 0)",
    card: "oklch(0.1 0 0)",
    cardForeground: "oklch(0.98 0 0)",
    popover: "oklch(0.1 0 0)",
    popoverForeground: "oklch(0.98 0 0)",
    primary: "oklch(0.86 0.16 195)",
    primaryForeground: "oklch(0.04 0 0)",
    secondary: "oklch(0.18 0 0)",
    secondaryForeground: "oklch(0.98 0 0)",
    muted: "oklch(0.18 0 0)",
    mutedForeground: "oklch(0.9 0 0)",
    accent: "oklch(0.86 0.16 195)",
    accentForeground: "oklch(0.04 0 0)",
    destructive: "oklch(0.78 0.18 25)",
    destructiveForeground: "oklch(0.04 0 0)",
    border: "oklch(0.72 0 0)",
    input: "oklch(0.72 0 0)",
    ring: "oklch(0.9 0.19 100)",
    chart1: "oklch(0.86 0.16 195)",
    chart2: "oklch(0.9 0.19 100)",
    chart3: "oklch(0.8 0.18 145)",
    chart4: "oklch(0.78 0.19 25)",
    chart5: "oklch(0.8 0.16 315)",
  },
};

const contrastPairs = [
  ["background", "foreground"],
  ["card", "cardForeground"],
  ["popover", "popoverForeground"],
  ["primary", "primaryForeground"],
  ["secondary", "secondaryForeground"],
  ["muted", "mutedForeground"],
  ["accent", "accentForeground"],
  ["destructive", "destructiveForeground"],
] as const satisfies ReadonlyArray<
  readonly [GridframeThemeColor, GridframeThemeColor]
>;

function validateGridframeTheme(
  value: unknown,
  requiredContrast = 4.5,
): ThemeValidationResult {
  const issues: ThemeValidationIssue[] = [];
  if (!value || typeof value !== "object") {
    return {
      valid: false,
      issues: [
        {
          path: "theme",
          code: "invalid-theme",
          message: "Theme must be an object.",
        },
      ],
      checks: [],
    };
  }
  const theme = value as Partial<GridframeTheme>;
  if (
    typeof theme.name !== "string" ||
    (theme.colorScheme !== "light" && theme.colorScheme !== "dark") ||
    (theme.contrast !== "standard" && theme.contrast !== "high")
  ) {
    issues.push({
      path: "theme",
      code: "invalid-theme",
      message: "Theme metadata is incomplete.",
    });
  }
  if (!theme.colors || typeof theme.colors !== "object") {
    issues.push({
      path: "colors",
      code: "invalid-theme",
      message: "Theme colors are required.",
    });
    return { valid: false, issues, checks: [] };
  }
  const colors = theme.colors as Partial<GridframeThemeColors>;

  for (const key of themeColorKeys) {
    const color = colors[key];
    if (typeof color !== "string" || !parse(color)) {
      issues.push({
        path: `colors.${key}`,
        code: "invalid-color",
        message: `${key} must be a valid CSS color.`,
      });
    }
  }

  const checks =
    issues.length === 0
      ? getThemeAccessibilityChecks(
          colors as GridframeThemeColors,
          requiredContrast,
        )
      : [];
  for (const check of checks) {
    if (check.passed) continue;
    issues.push({
      path: check.path,
      code: check.kind === "contrast" ? "contrast" : "distinction",
      message:
        check.kind === "contrast"
          ? `${check.label} needs ${check.required}:1 contrast.`
          : `${check.label} needs a perceptual difference of ${check.required}.`,
      actual: check.actual,
      required: check.required,
      suggestedColor: check.suggestedColor,
    });
  }

  return { valid: issues.length === 0, issues, checks };
}

const toOklch = converter("oklch");

function normalizeColor(value: string) {
  const color = toOklch(value);
  if (!color) {
    return undefined;
  }

  const alpha =
    color.alpha === undefined || color.alpha === 1
      ? ""
      : ` / ${formatNumber(color.alpha)}`;
  return `oklch(${formatNumber(color.l)} ${formatNumber(color.c ?? 0)} ${formatNumber(color.h ?? 0)}${alpha})`;
}

function colorToHex(value: string) {
  const color = parse(value);
  return color ? formatHex(color) : undefined;
}

function formatNumber(value: number) {
  return Number(value.toFixed(4)).toString();
}

function mixColors(from: string, to: string, amount: number) {
  const mixed = interpolate([from, to], "oklch")(amount);
  return normalizeColor(
    `oklch(${mixed.l} ${mixed.c ?? 0} ${mixed.h ?? 0}${mixed.alpha === undefined ? "" : ` / ${mixed.alpha}`})`,
  )!;
}

function rotateColor(value: string, degrees: number) {
  const color = toOklch(value)!;
  return normalizeColor(
    `oklch(${color.l} ${color.c ?? 0} ${((color.h ?? 0) + degrees + 360) % 360})`,
  )!;
}

function readableForeground(background: string, ...candidates: string[]) {
  const options =
    candidates.length > 0 ? candidates : ["oklch(0.04 0 0)", "oklch(0.99 0 0)"];
  return options.reduce((best, candidate) =>
    wcagContrast(background, candidate) > wcagContrast(background, best)
      ? candidate
      : best,
  );
}

function perceptualDifference(first: string, second: string) {
  const left = toOklch(first);
  const right = toOklch(second);
  if (!left || !right) return 0;
  const hueDifference =
    Math.min(
      Math.abs((left.h ?? 0) - (right.h ?? 0)),
      360 - Math.abs((left.h ?? 0) - (right.h ?? 0)),
    ) / 180;
  const averageChroma = ((left.c ?? 0) + (right.c ?? 0)) / 2;
  return (
    Math.sqrt(
      (left.l - right.l) ** 2 +
        ((left.c ?? 0) - (right.c ?? 0)) ** 2 +
        (hueDifference * averageChroma) ** 2,
    ) * 100
  );
}

function getThemeAccessibilityChecks(
  colors: GridframeThemeColors,
  requiredTextContrast = 4.5,
): ThemeAccessibilityCheck[] {
  const checks: ThemeAccessibilityCheck[] = contrastPairs.map(
    ([background, foreground]) => {
      const actual = wcagContrast(colors[background], colors[foreground]);
      return {
        path: `colors.${foreground}`,
        label: `${foreground} against ${background}`,
        kind: "contrast",
        actual,
        required: requiredTextContrast,
        passed: actual >= requiredTextContrast,
        suggestedColor: readableForeground(colors[background]),
      };
    },
  );

  for (const surface of ["background", "card"] as const) {
    const actual = wcagContrast(colors[surface], colors.ring);
    checks.push({
      path: "colors.ring",
      label: `focus ring against ${surface}`,
      kind: "contrast",
      actual,
      required: 3,
      passed: actual >= 3,
      suggestedColor: readableForeground(colors[surface]),
    });
  }

  const charts = [
    "chart1",
    "chart2",
    "chart3",
    "chart4",
    "chart5",
  ] as const;
  for (const chart of charts) {
    const actual = wcagContrast(colors.card, colors[chart]);
    checks.push({
      path: `colors.${chart}`,
      label: `${chart} against card`,
      kind: "contrast",
      actual,
      required: 3,
      passed: actual >= 3,
      suggestedColor: readableForeground(colors.card),
    });
  }
  for (let first = 0; first < charts.length; first += 1) {
    for (let second = first + 1; second < charts.length; second += 1) {
      const firstChart = charts[first]!;
      const secondChart = charts[second]!;
      const actual = perceptualDifference(
        colors[firstChart],
        colors[secondChart],
      );
      checks.push({
        path: `colors.${secondChart}`,
        label: `${firstChart} from ${secondChart}`,
        kind: "difference",
        actual,
        required: 3,
        passed: actual >= 3,
      });
    }
  }
  return checks;
}

function createGridframeTheme(
  foundation: unknown,
  options: { name?: string } | null = {},
): ThemeGenerationResult {
  const invalidIssues: ThemeValidationIssue[] = [];
  const fallbackFoundation: GridframeThemeFoundation = {
    background: lightTheme.colors.background,
    surface: lightTheme.colors.card,
    text: lightTheme.colors.foreground,
    primary: lightTheme.colors.primary,
    accent: lightTheme.colors.accent,
    destructive: lightTheme.colors.destructive,
  };
  const foundationKeys = Object.keys(
    fallbackFoundation,
  ) as (keyof GridframeThemeFoundation)[];
  const foundationValue =
    foundation && typeof foundation === "object"
      ? (foundation as Partial<Record<keyof GridframeThemeFoundation, unknown>>)
      : {};
  if (!foundation || typeof foundation !== "object") {
    invalidIssues.push({
      path: "foundation",
      code: "invalid-theme",
      message: "Foundation must be an object.",
    });
  }
  const rawFoundation = Object.fromEntries(
    foundationKeys.map((key) => [
      key,
      typeof foundationValue[key] === "string" ? foundationValue[key] : "",
    ]),
  ) as GridframeThemeFoundation;
  const normalized = Object.fromEntries(
    foundationKeys.map((key) => {
      const value = rawFoundation[key];
      const color = normalizeColor(value);
      if (!color) {
        invalidIssues.push({
          path: `foundation.${key}`,
          code: "invalid-color",
          message: `${key} must be a valid CSS color.`,
        });
      }
      return [
        key,
        color ?? fallbackFoundation[key as keyof GridframeThemeFoundation],
      ];
    }),
  ) as GridframeThemeFoundation;
  const colorScheme =
    wcagLuminance(normalized.background) < wcagLuminance(normalized.text)
      ? "dark"
      : "light";
  const foregroundCandidates = [normalized.text, normalized.background];
  const secondary = mixColors(normalized.surface, normalized.text, 0.12);
  const muted = mixColors(normalized.surface, normalized.text, 0.12);
  const preferredRing =
    wcagContrast(normalized.primary, normalized.background) >= 3 &&
    wcagContrast(normalized.primary, normalized.surface) >= 3
      ? normalized.primary
      : readableForeground(normalized.background, normalized.text);
  const colors: GridframeThemeColors = {
    background: normalized.background,
    foreground: normalized.text,
    card: normalized.surface,
    cardForeground: normalized.text,
    popover: normalized.surface,
    popoverForeground: normalized.text,
    primary: normalized.primary,
    primaryForeground: readableForeground(
      normalized.primary,
      ...foregroundCandidates,
    ),
    secondary,
    secondaryForeground: readableForeground(
      secondary,
      normalized.text,
      normalized.background,
    ),
    muted,
    mutedForeground: readableForeground(
      muted,
      normalized.text,
      normalized.background,
    ),
    accent: normalized.accent,
    accentForeground: readableForeground(
      normalized.accent,
      ...foregroundCandidates,
    ),
    destructive: normalized.destructive,
    destructiveForeground: readableForeground(
      normalized.destructive,
      ...foregroundCandidates,
    ),
    border: mixColors(normalized.surface, normalized.text, 0.24),
    input: mixColors(normalized.surface, normalized.text, 0.3),
    ring: preferredRing,
    chart1: normalized.primary,
    chart2: normalized.accent,
    chart3: normalized.destructive,
    chart4: rotateColor(normalized.primary, 115),
    chart5: rotateColor(normalized.accent, 185),
  };
  const theme: GridframeTheme = {
    name: options?.name?.trim() || "Custom",
    colorScheme,
    contrast: "standard",
    colors,
  };
  const validation = validateGridframeTheme(theme);
  const issues = [...invalidIssues, ...validation.issues];

  return {
    foundation: rawFoundation,
    theme,
    issues,
    checks: validation.checks,
    valid: issues.length === 0,
  };
}

function foundationFromTheme(theme: GridframeTheme): GridframeThemeFoundation {
  return {
    background: theme.colors.background,
    surface: theme.colors.card,
    text: theme.colors.foreground,
    primary: theme.colors.primary,
    accent: theme.colors.accent,
    destructive: theme.colors.destructive,
  };
}

function serializeGridframeTheme(
  theme: GridframeTheme,
  foundation = foundationFromTheme(theme),
) {
  return JSON.stringify(
    {
      version: 1,
      name: theme.name,
      foundation,
      theme: {
        colorScheme: theme.colorScheme,
        contrast: theme.contrast,
        colors: theme.colors,
      },
    },
    null,
    2,
  );
}

function themeToCssVariables(theme: GridframeTheme) {
  const declarations = Object.entries(themeToStyleVariables(theme))
    .filter(([key]) => key.startsWith("--"))
    .map(([key, value]) => `  ${key}: ${value};`);
  return `:root {\n  color-scheme: ${theme.colorScheme};\n${declarations.join("\n")}\n}`;
}

function themeToStyleVariables(theme: GridframeTheme): Record<string, string> {
  return Object.fromEntries([
    ["colorScheme", theme.colorScheme],
    ...themeColorKeys.map((key) => [
      `--${key
        .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
        .replace(/(\D)(\d)/g, "$1-$2")}`,
      theme.colors[key],
    ]),
  ]);
}

export {
  colorToHex,
  createGridframeTheme,
  darkTheme,
  highContrastTheme,
  lightTheme,
  serializeGridframeTheme,
  themeColorKeys,
  themeToCssVariables,
  themeToStyleVariables,
  validateGridframeTheme,
};
export type {
  GridframeTheme,
  GridframeThemeColor,
  GridframeThemeColors,
  GridframeThemeFoundation,
  ThemeGenerationResult,
  ThemeAccessibilityCheck,
  ThemeValidationIssue,
  ThemeValidationResult,
};
