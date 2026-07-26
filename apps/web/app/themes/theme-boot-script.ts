import {
  darkTheme,
  highContrastTheme,
  lightTheme,
  themeColorKeys,
  themeToStyleVariables,
  type GridframeTheme,
} from "@gridframe/react/theme";

const presetStyles = {
  light: themeToStyleVariables(lightTheme),
  dark: themeToStyleVariables(darkTheme),
  "high-contrast": themeToStyleVariables(highContrastTheme),
};

function themeValidationHash(theme: GridframeTheme) {
  let hash = 2166136261;
  for (const character of JSON.stringify(theme)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

const themeBootScript = `(() => {
  const selectionKey = "gridframe.theme.selection.v1";
  const customKey = "gridframe.theme.custom.v1";
  const presets = ${JSON.stringify(presetStyles)};
  const colorKeys = ${JSON.stringify(themeColorKeys)};
  const foundationKeys = ["background", "surface", "text", "primary", "accent", "destructive"];
  const validationHash = theme => {
    let hash = 2166136261;
    for (const character of JSON.stringify(theme)) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  };
  const fallback = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  let selection = fallback;
  let styles = presets[fallback];
  try {
    const storedSelection = localStorage.getItem(selectionKey);
    if (storedSelection && presets[storedSelection]) {
      selection = storedSelection;
      styles = presets[storedSelection];
    } else if (storedSelection === "custom") {
      const custom = JSON.parse(localStorage.getItem(customKey) || "null");
      const validColor = value =>
        typeof value === "string" &&
        (!globalThis.CSS || typeof CSS.supports !== "function" || CSS.supports("color", value));
      const validCustom =
        custom &&
        custom.version === 1 &&
        typeof custom.name === "string" &&
        custom.foundation &&
        foundationKeys.every(key => typeof custom.foundation[key] === "string") &&
        custom.theme &&
        typeof custom.theme.name === "string" &&
        (custom.theme.colorScheme === "light" || custom.theme.colorScheme === "dark") &&
        (custom.theme.contrast === "standard" || custom.theme.contrast === "high") &&
        custom.theme.colors &&
        colorKeys.every(key => validColor(custom.theme.colors[key])) &&
        typeof custom.validationHash === "string" &&
        custom.validationHash === validationHash(custom.theme);
      if (validCustom) {
        selection = "custom";
        styles = { colorScheme: custom.theme.colorScheme };
        for (const key of colorKeys) {
          const value = custom.theme.colors[key];
          const property = "--" + key
            .replace(/[A-Z]/g, letter => "-" + letter.toLowerCase())
            .replace(/(\\D)(\\d)/g, "$1-$2");
          styles[property] = value;
        }
      }
    }
  } catch {
    selection = fallback;
    styles = presets[fallback];
  }
  for (const [property, value] of Object.entries(styles)) {
    if (property === "colorScheme") document.documentElement.style.colorScheme = value;
    else document.documentElement.style.setProperty(property, value);
  }
  document.documentElement.dataset.theme = selection;
  const syncControls = () => {
    for (const control of document.querySelectorAll("[data-theme-switcher]")) {
      if (control instanceof HTMLSelectElement) control.value = selection;
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncControls, { once: true });
  } else {
    syncControls();
  }
})();`;

export { themeBootScript, themeValidationHash };
