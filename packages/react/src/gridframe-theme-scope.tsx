"use client";

import type { CSSProperties, ReactNode } from "react";

import {
  type GridframeTheme,
  themeToStyleVariables,
  validateGridframeTheme,
} from "./theme";

type GridframeThemeScopeProps = {
  children: ReactNode;
  className?: string;
  theme: GridframeTheme;
};

function GridframeThemeScope({
  children,
  className,
  theme,
}: GridframeThemeScopeProps) {
  const validation = validateGridframeTheme(theme);
  if (!validation.valid) {
    const runtime = globalThis as typeof globalThis & {
      process?: { env?: { NODE_ENV?: string } };
    };
    if (runtime.process?.env?.NODE_ENV !== "production") {
      console.warn(
        `GridframeThemeScope received an invalid Theme and kept the inherited Theme (${validation.issues
          .map((issue) => issue.path)
          .join(", ")}).`,
      );
    }
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
      data-gridframe-contrast={theme.contrast}
      data-gridframe-theme={theme.colorScheme}
      style={themeToStyleVariables(theme) as CSSProperties}
    >
      {children}
    </div>
  );
}

export { GridframeThemeScope };
export type { GridframeThemeScopeProps };
