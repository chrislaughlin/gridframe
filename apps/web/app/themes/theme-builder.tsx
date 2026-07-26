"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { CardVisualization } from "@gridframe/react";
import {
  colorToHex,
  createGridframeTheme,
  serializeGridframeTheme,
  themeColorKeys,
  themeToCssVariables,
  themeToStyleVariables,
  type GridframeThemeFoundation,
} from "@gridframe/react/theme";

import { examples } from "../data/examples";
import { useTheme } from "./theme-provider";

const DRAFT_STORAGE_PREFIX = "gridframe.theme.draft.v1";
const DRAFT_TAB_KEY = "gridframe.theme.draft-tab.v1";
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const defaultFoundation: GridframeThemeFoundation = {
  background: "#f8fafc",
  surface: "#ffffff",
  text: "#111827",
  primary: "#1d4ed8",
  accent: "#0f766e",
  destructive: "#b91c1c",
};
const foundationFields = [
  ["background", "Background", "The page canvas"],
  ["surface", "Surface", "Cards, menus, and raised regions"],
  ["text", "Text", "Primary content and labels"],
  ["primary", "Primary", "Main actions and links"],
  ["accent", "Accent", "Selected and highlighted states"],
  ["destructive", "Destructive", "Dangerous actions and errors"],
] as const;
const previewSlugs = [
  "metric",
  "chart-bar-default",
  "chart-area-default",
  "chart-line-default",
  "chart-pie-donut",
  "chart-radar-dots",
  "chart-radial-label",
  "table",
];

type ThemeDraft = {
  name: string;
  foundation: GridframeThemeFoundation;
};

function draftStorageKey() {
  try {
    let tabId = sessionStorage.getItem(DRAFT_TAB_KEY);
    if (!tabId) {
      tabId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(DRAFT_TAB_KEY, tabId);
    }
    return `${DRAFT_STORAGE_PREFIX}:${tabId}`;
  } catch {
    return undefined;
  }
}

function readDraft(key: string | undefined, fallback: ThemeDraft): ThemeDraft {
  try {
    if (!key) return fallback;
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const draft = JSON.parse(stored) as ThemeDraft & { version?: number };
    return draft.version === 1 &&
      typeof draft.name === "string" &&
      draft.foundation &&
      foundationFields.every(
        ([foundationKey]) =>
          typeof draft.foundation[foundationKey] === "string",
      )
      ? draft
      : fallback;
  } catch {
    return fallback;
  }
}

function ThemeBuilder() {
  const { customTheme, deleteCustomTheme, saveAndUseCustomTheme } = useTheme();
  const savedDraft = useMemo<ThemeDraft>(
    () => ({
      name: customTheme?.name ?? "Custom",
      foundation: customTheme?.foundation ?? defaultFoundation,
    }),
    [customTheme],
  );
  const [draft, setDraft] = useState<ThemeDraft>(savedDraft);
  const [storageKey, setStorageKey] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const result = useMemo(
    () =>
      createGridframeTheme(draft.foundation, {
        name: draft.name,
      }),
    [draft],
  );
  const formatIssues = useMemo(
    () =>
      foundationFields
        .filter(([key]) => !HEX_COLOR.test(draft.foundation[key]))
        .map(([key, label]) => ({
          path: `foundation.${key}`,
          message: `${label} must use a six-digit hex value such as #1d4ed8.`,
        })),
    [draft.foundation],
  );
  const canUse =
    result.valid && formatIssues.length === 0 && draft.name.trim().length > 0;

  useLayoutEffect(() => {
    const key = draftStorageKey();
    setDraft(readDraft(key, savedDraft));
    setStorageKey(key);
  }, [savedDraft]);

  useEffect(() => {
    if (!storageKey) return;
    const serialized = JSON.stringify({ version: 1, ...draft });
    try {
      localStorage.setItem(storageKey, serialized);
    } catch {
      // Draft persistence is optional when storage is unavailable.
    }
  }, [draft, storageKey]);

  function updateFoundation(
    key: keyof GridframeThemeFoundation,
    value: string,
  ) {
    setNotice(undefined);
    setDraft((current) => ({
      ...current,
      foundation: { ...current.foundation, [key]: value },
    }));
  }

  function resetDraft() {
    const next = {
      name: customTheme?.name ?? "Custom",
      foundation: customTheme?.foundation ?? defaultFoundation,
    };
    setDraft(next);
    setNotice("Draft reset.");
  }

  function saveTheme() {
    if (!canUse) return;
    saveAndUseCustomTheme({
      name: result.theme.name,
      foundation: draft.foundation,
      theme: result.theme,
    });
    setNotice(`${result.theme.name} is now active.`);
  }

  async function copyOutput(kind: "json" | "css") {
    const output =
      kind === "json"
        ? serializeGridframeTheme(result.theme, draft.foundation)
        : themeToCssVariables(result.theme);
    await navigator.clipboard.writeText(output);
    setNotice(`${kind === "json" ? "JSON" : "CSS"} copied.`);
  }

  function deleteTheme() {
    if (
      !customTheme ||
      !window.confirm(
        `Delete ${customTheme.name}? This removes its saved Theme and draft.`,
      )
    ) {
      return;
    }
    deleteCustomTheme();
    setDraft({ name: "Custom", foundation: defaultFoundation });
    try {
      if (storageKey) localStorage.removeItem(storageKey);
    } catch {
      // The in-memory draft is still cleared.
    }
    setNotice("Custom theme deleted.");
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="mb-3 font-mono text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Theme laboratory
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">
            Build color with evidence.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Choose six foundation colors. Gridframe derives the complete Theme,
            tests the important relationships, and shows the result against real
            Dashboard components.
          </p>
        </div>
        <div
          className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm"
          role="status"
        >
          <span
            aria-hidden="true"
            className={`size-2.5 rounded-full ${
              canUse ? "bg-primary" : "bg-destructive"
            }`}
          />
          <span className="font-medium text-card-foreground">
            {canUse
              ? "Ready to use"
              : `${result.issues.length + formatIssues.length} ${
                  result.issues.length > 0 ? "accessibility " : ""
                }issue${
                  result.issues.length + formatIssues.length === 1 ? "" : "s"
                }`}
          </span>
        </div>
      </header>

      <div className="mt-8 grid items-start gap-8 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-20">
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <label className="block">
              <span className="text-xs font-semibold tracking-wide text-card-foreground uppercase">
                Theme name
              </span>
              <input
                aria-label="Theme name"
                className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                maxLength={40}
                onChange={(event) => {
                  setNotice(undefined);
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }));
                }}
                value={draft.name}
              />
            </label>

            <div className="mt-6 divide-y divide-border">
              {foundationFields.map(([key, label, description]) => {
                const value = draft.foundation[key];
                const pickerValue = HEX_COLOR.test(value) ? value : "#000000";
                return (
                  <div className="grid gap-2 py-4 first:pt-0" key={key}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <label
                          className="text-sm font-semibold text-card-foreground"
                          htmlFor={`theme-${key}-text`}
                        >
                          {label}
                        </label>
                        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                          {description}
                        </p>
                      </div>
                      <label
                        className="relative size-10 shrink-0 overflow-hidden rounded-full border-2 border-background shadow-[0_0_0_1px_var(--border)]"
                        style={{ backgroundColor: pickerValue }}
                      >
                        <span className="sr-only">{label} color picker</span>
                        <input
                          aria-label={`${label} color picker`}
                          className="absolute inset-0 cursor-pointer opacity-0"
                          onChange={(event) =>
                            updateFoundation(key, event.target.value)
                          }
                          type="color"
                          value={pickerValue}
                        />
                      </label>
                    </div>
                    <input
                      aria-label={`${label} hex color`}
                      className="min-h-10 rounded-md border border-input bg-background px-3 font-mono text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      id={`theme-${key}-text`}
                      onChange={(event) =>
                        updateFoundation(key, event.target.value)
                      }
                      spellCheck={false}
                      value={value}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {result.issues.length > 0 || formatIssues.length > 0 ? (
            <section
              aria-labelledby="theme-issues-title"
              className="rounded-lg border border-destructive/60 bg-destructive/5 p-5"
            >
              <h2
                className="text-sm font-semibold text-foreground"
                id="theme-issues-title"
              >
                Needs attention
              </h2>
              <ul className="mt-3 space-y-3">
                {formatIssues.map((issue) => (
                  <li
                    className="border-l-2 border-destructive pl-3 text-xs leading-5 text-muted-foreground"
                    key={issue.path}
                  >
                    <span className="block font-medium text-foreground">
                      {issue.message}
                    </span>
                  </li>
                ))}
                {result.issues.map((issue, index) => (
                  <li
                    className="border-l-2 border-destructive pl-3 text-xs leading-5 text-muted-foreground"
                    key={`${issue.path}-${index}`}
                  >
                    <span className="block font-medium text-foreground">
                      {issue.message}
                    </span>
                    {issue.actual && issue.required ? (
                      <span>
                        {issue.actual.toFixed(2)}:1 measured; {issue.required}:1
                        required.
                      </span>
                    ) : null}
                    {issue.suggestedColor ? (
                      <span className="mt-1 block font-mono">
                        Suggested foreground:{" "}
                        {colorToHex(issue.suggestedColor) ??
                          issue.suggestedColor}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="grid gap-2">
            <button
              className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-transform active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!canUse}
              onClick={saveTheme}
              type="button"
            >
              Save and use theme
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="min-h-11 rounded-md border border-border bg-card px-3 text-xs font-semibold text-card-foreground hover:bg-accent"
                onClick={() => void copyOutput("json")}
                type="button"
              >
                Copy JSON
              </button>
              <button
                className="min-h-11 rounded-md border border-border bg-card px-3 text-xs font-semibold text-card-foreground hover:bg-accent"
                onClick={() => void copyOutput("css")}
                type="button"
              >
                Copy CSS
              </button>
            </div>
            <button
              className="min-h-11 rounded-md px-3 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={resetDraft}
              type="button"
            >
              Reset draft
            </button>
            {customTheme ? (
              <button
                className="min-h-11 rounded-md px-3 text-xs font-semibold text-destructive hover:bg-destructive/10"
                onClick={deleteTheme}
                type="button"
              >
                Delete saved Custom theme
              </button>
            ) : null}
            {notice ? (
              <p className="pt-2 text-center text-xs text-muted-foreground">
                {notice}
              </p>
            ) : null}
          </section>
        </aside>

        <div className="min-w-0 space-y-8">
          <ThemePreview
            style={themeToStyleVariables(result.theme) as CSSProperties}
          />
          <ThemeDiagnostics result={result} />
        </div>
      </div>
    </div>
  );
}

function ThemeDiagnostics({
  result,
}: {
  result: ReturnType<typeof createGridframeTheme>;
}) {
  return (
    <section
      aria-label="Generated theme diagnostics"
      className="grid gap-6 lg:grid-cols-2"
    >
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">
          Generated Theme values
        </h2>
        <dl className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2">
          {themeColorKeys.map((key) => (
            <div className="min-w-0" key={key}>
              <dt className="text-xs text-muted-foreground">{key}</dt>
              <dd className="mt-1 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 rounded-sm border border-border"
                  style={{ backgroundColor: result.theme.colors[key] }}
                />
                <code className="truncate text-[10px] text-card-foreground">
                  {result.theme.colors[key]}
                </code>
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">
          Accessibility report
        </h2>
        <ul className="mt-4 space-y-2">
          {result.checks.map((check) => (
            <li
              className="flex items-start justify-between gap-4 border-b border-border/70 pb-2 text-xs last:border-0"
              key={`${check.kind}-${check.label}`}
            >
              <span className="text-muted-foreground">{check.label}</span>
              <span
                className={
                  check.passed
                    ? "font-semibold text-card-foreground"
                    : "font-semibold text-destructive"
                }
              >
                {check.passed ? "Pass" : "Fail"} · {check.actual.toFixed(2)} /{" "}
                {check.required}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ThemePreview({ style }: { style: CSSProperties }) {
  const previewExamples = previewSlugs
    .map((slug) => examples.find((example) => example.slug === slug))
    .filter((example) => example !== undefined);

  return (
    <section
      aria-label="Custom theme preview"
      className="overflow-hidden rounded-xl border border-border shadow-[0_24px_80px_-40px_color-mix(in_oklch,var(--foreground)_35%,transparent)]"
      style={style}
    >
      <div className="bg-background text-foreground">
        <header className="border-b border-border bg-card/80 px-5 py-4 backdrop-blur sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">
                Live compatibility canvas
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                Operations Dashboard
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label>
                <span className="sr-only">Preview period</span>
                <select className="min-h-10 rounded-md border border-input bg-background px-3 text-xs">
                  <option>Last 30 days</option>
                </select>
              </label>
              <button
                className="min-h-10 rounded-md border border-border bg-secondary px-3 text-xs font-semibold text-secondary-foreground hover:bg-accent"
                type="button"
              >
                Secondary
              </button>
              <button
                className="min-h-10 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
                type="button"
              >
                Primary action
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <PreviewState label="Loading" tone="muted" value="Syncing data…" />
            <PreviewState
              label="Success"
              tone="accent"
              value="All systems go"
            />
            <PreviewState
              label="Error"
              tone="destructive"
              value="2 checks failed"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {previewExamples.map((example) => (
              <article
                className={`min-w-0 rounded-lg border border-border bg-card p-4 text-card-foreground ${
                  example.visualization === "table"
                    ? "md:col-span-2 2xl:col-span-3"
                    : ""
                }`}
                key={example.slug}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{example.title}</h3>
                  <span className="rounded-full bg-muted px-2 py-1 font-mono text-[9px] tracking-wide text-muted-foreground uppercase">
                    {example.visualization}
                  </span>
                </div>
                <div className="min-h-52">
                  <CardVisualization data={example.data} />
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/35 p-4">
            <a
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              href="#theme-preview-link"
            >
              Interactive link
            </a>
            <button
              aria-pressed="true"
              className="rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground ring-2 ring-ring"
              type="button"
            >
              Selected state
            </button>
            <button
              className="rounded-md bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground"
              type="button"
            >
              Destructive action
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewState({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "muted" | "accent" | "destructive";
}) {
  const toneClass = {
    muted: "border-border bg-muted text-muted-foreground",
    accent: "border-accent bg-accent text-accent-foreground",
    destructive: "border-destructive/60 bg-destructive/10 text-card-foreground",
  }[tone];
  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="font-mono text-[9px] font-semibold tracking-widest uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

export { ThemeBuilder };
