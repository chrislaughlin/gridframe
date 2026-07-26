"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  darkTheme,
  highContrastTheme,
  lightTheme,
  themeToStyleVariables,
  validateGridframeTheme,
  type GridframeTheme,
  type GridframeThemeFoundation,
} from "@gridframe/react/theme";
import { themeValidationHash } from "./theme-boot-script";

const THEME_SELECTION_STORAGE_KEY = "gridframe.theme.selection.v1";
const CUSTOM_THEME_STORAGE_KEY = "gridframe.theme.custom.v1";
const foundationKeys = [
  "background",
  "surface",
  "text",
  "primary",
  "accent",
  "destructive",
] as const;

type ThemeSelection = "light" | "dark" | "high-contrast" | "custom";

type SavedCustomTheme = {
  name: string;
  foundation: GridframeThemeFoundation;
  theme: GridframeTheme;
};

type ThemeContextValue = {
  selection: ThemeSelection;
  theme: GridframeTheme;
  customTheme?: SavedCustomTheme;
  selectTheme: (selection: ThemeSelection) => void;
  saveAndUseCustomTheme: (customTheme: SavedCustomTheme) => void;
  deleteCustomTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function systemSelection(): "light" | "dark" {
  return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function isThemeSelection(value: string | null): value is ThemeSelection {
  return (
    value === "light" ||
    value === "dark" ||
    value === "high-contrast" ||
    value === "custom"
  );
}

function readCustomTheme(): SavedCustomTheme | undefined {
  try {
    const stored = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
    if (!stored) return undefined;
    const envelope = JSON.parse(stored) as {
      version?: unknown;
      name?: unknown;
      foundation?: unknown;
      theme?: unknown;
      validationHash?: unknown;
    };
    if (
      envelope.version !== 1 ||
      typeof envelope.name !== "string" ||
      !envelope.foundation ||
      !envelope.theme ||
      typeof envelope.validationHash !== "string"
    ) {
      return undefined;
    }
    if (
      typeof envelope.foundation !== "object" ||
      !foundationKeys.every(
        (key) =>
          typeof (envelope.foundation as Record<string, unknown>)[key] ===
          "string",
      )
    ) {
      return undefined;
    }
    const theme = envelope.theme as GridframeTheme;
    if (
      envelope.validationHash !== themeValidationHash(theme) ||
      !validateGridframeTheme(theme).valid
    ) {
      return undefined;
    }
    return {
      name: envelope.name,
      foundation: envelope.foundation as GridframeThemeFoundation,
      theme,
    };
  } catch {
    return undefined;
  }
}

function readSelection(customTheme = readCustomTheme()): ThemeSelection {
  try {
    const stored = localStorage.getItem(THEME_SELECTION_STORAGE_KEY);
    if (isThemeSelection(stored) && (stored !== "custom" || customTheme)) {
      return stored;
    }
  } catch {
    // Storage is optional; system preference is the safe fallback.
  }
  return systemSelection();
}

function themeForSelection(
  selection: ThemeSelection,
  customTheme?: SavedCustomTheme,
) {
  if (selection === "dark") return darkTheme;
  if (selection === "high-contrast") return highContrastTheme;
  if (selection === "custom" && customTheme) return customTheme.theme;
  return lightTheme;
}

function applyTheme(theme: GridframeTheme, selection: ThemeSelection) {
  const root = document.documentElement;
  for (const [property, value] of Object.entries(
    themeToStyleVariables(theme),
  )) {
    if (property === "colorScheme") {
      root.style.colorScheme = value;
    } else {
      root.style.setProperty(property, value);
    }
  }
  root.dataset.theme = selection;
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [customTheme, setCustomTheme] = useState<
    SavedCustomTheme | undefined
  >();
  const [selection, setSelection] = useState<ThemeSelection>("light");
  const theme = themeForSelection(selection, customTheme);

  useLayoutEffect(() => {
    const nextCustom = readCustomTheme();
    const prepaintSelection = document.documentElement.dataset.theme ?? null;
    const nextSelection =
      isThemeSelection(prepaintSelection) &&
      (prepaintSelection !== "custom" || nextCustom)
        ? prepaintSelection
        : readSelection(nextCustom);
    setCustomTheme(nextCustom);
    setSelection(nextSelection);
    applyTheme(themeForSelection(nextSelection, nextCustom), nextSelection);
  }, []);

  useEffect(() => {
    applyTheme(theme, selection);
  }, [selection, theme]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (
        event.key !== THEME_SELECTION_STORAGE_KEY &&
        event.key !== CUSTOM_THEME_STORAGE_KEY
      ) {
        return;
      }
      const nextCustom = readCustomTheme();
      setCustomTheme(nextCustom);
      setSelection(readSelection(nextCustom));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const selectTheme = useCallback(
    (nextSelection: ThemeSelection) => {
      if (nextSelection === "custom" && !customTheme) return;
      try {
        localStorage.setItem(THEME_SELECTION_STORAGE_KEY, nextSelection);
      } catch {
        // The in-memory selection still works when storage is unavailable.
      }
      setSelection(nextSelection);
    },
    [customTheme],
  );

  const saveAndUseCustomTheme = useCallback(
    (nextCustomTheme: SavedCustomTheme) => {
      if (!validateGridframeTheme(nextCustomTheme.theme).valid) return;
      try {
        localStorage.setItem(
          CUSTOM_THEME_STORAGE_KEY,
          JSON.stringify({
            version: 1,
            ...nextCustomTheme,
            validationHash: themeValidationHash(nextCustomTheme.theme),
          }),
        );
        localStorage.setItem(THEME_SELECTION_STORAGE_KEY, "custom");
      } catch {
        // The in-memory Theme remains usable for this tab.
      }
      setCustomTheme(nextCustomTheme);
      setSelection("custom");
    },
    [],
  );

  const deleteCustomTheme = useCallback(() => {
    try {
      localStorage.removeItem(CUSTOM_THEME_STORAGE_KEY);
    } catch {
      // Continue clearing the in-memory Theme.
    }
    setCustomTheme(undefined);
    setSelection((current) => {
      if (current !== "custom") return current;
      const fallback = systemSelection();
      try {
        localStorage.setItem(THEME_SELECTION_STORAGE_KEY, fallback);
      } catch {
        // The fallback still applies in memory.
      }
      return fallback;
    });
  }, []);

  const value = useMemo(
    () => ({
      selection,
      theme,
      customTheme,
      selectTheme,
      saveAndUseCustomTheme,
      deleteCustomTheme,
    }),
    [
      customTheme,
      deleteCustomTheme,
      saveAndUseCustomTheme,
      selectTheme,
      selection,
      theme,
    ],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }
  return context;
}

export {
  CUSTOM_THEME_STORAGE_KEY,
  THEME_SELECTION_STORAGE_KEY,
  ThemeProvider,
  applyTheme,
  useTheme,
};
export type { SavedCustomTheme, ThemeSelection };
