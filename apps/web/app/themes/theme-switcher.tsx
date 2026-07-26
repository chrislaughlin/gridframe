"use client";

import Link from "next/link";

import { useTheme, type ThemeSelection } from "./theme-provider";

function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { selection, customTheme, selectTheme } = useTheme();

  return (
    <div
      className={
        compact
          ? "flex flex-col gap-1.5"
          : "flex items-center gap-2 rounded-md border border-border bg-card/70 p-1 shadow-sm"
      }
    >
      <label className="relative flex items-center">
        <span className="sr-only">Theme</span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 size-2 rounded-full bg-primary ring-2 ring-background"
        />
        <select
          aria-label="Theme"
          className="min-h-10 appearance-none rounded-sm border-0 bg-transparent py-2 pr-7 pl-7 text-xs font-semibold text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          data-theme-switcher
          onChange={(event) =>
            selectTheme(event.target.value as ThemeSelection)
          }
          value={selection}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="high-contrast">High Contrast</option>
          {customTheme ? (
            <option value="custom">Custom — {customTheme.name}</option>
          ) : null}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2 text-[10px] text-muted-foreground"
        >
          ▾
        </span>
      </label>
      <Link
        className={
          compact
            ? "flex min-h-11 items-center rounded-sm px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            : "rounded-sm px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        }
        href="/themes"
      >
        Build a theme
      </Link>
    </div>
  );
}

export { ThemeSwitcher };
