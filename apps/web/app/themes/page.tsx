import type { Metadata } from "next";

import { ThemeBuilder } from "./theme-builder";

export const metadata: Metadata = {
  title: "Theme Builder — Gridframe",
  description:
    "Create, validate, preview, and export a custom Gridframe Dashboard theme.",
};

export default function ThemesPage() {
  return <ThemeBuilder />;
}
