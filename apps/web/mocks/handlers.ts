import { type PanelCardDataResponse } from "@gridframe/react";
import { delay, http, HttpResponse } from "msw";

const handlers = [
  http.get("/api/gridframe/cards/area-chart", async () => {
    await delay(300);

    return HttpResponse.json({
      status: "success",
      data: {
        visualization: "area",
        indexKey: "month",
        series: [
          {
            key: "desktop",
            label: "Desktop",
            color: "var(--chart-1)",
          },
          {
            key: "mobile",
            label: "Mobile",
            color: "var(--chart-2)",
          },
        ],
        data: [
          { month: "Jan", desktop: 186, mobile: 80 },
          { month: "Feb", desktop: 305, mobile: 200 },
          { month: "Mar", desktop: 237, mobile: 120 },
          { month: "Apr", desktop: 73, mobile: 190 },
          { month: "May", desktop: 209, mobile: 130 },
          { month: "Jun", desktop: 214, mobile: 140 },
        ],
      },
    } satisfies PanelCardDataResponse);
  }),

  http.get("/api/gridframe/cards/bar-chart", async () => {
    await delay(350);

    return HttpResponse.json({
      status: "success",
      data: {
        visualization: "bar",
        indexKey: "browser",
        series: [
          {
            key: "visitors",
            label: "Visitors",
            color: "var(--chart-3)",
          },
        ],
        data: [
          { browser: "Chrome", visitors: 275 },
          { browser: "Safari", visitors: 200 },
          { browser: "Firefox", visitors: 187 },
          { browser: "Edge", visitors: 173 },
          { browser: "Other", visitors: 90 },
        ],
      },
    } satisfies PanelCardDataResponse);
  }),

  http.get("/api/gridframe/cards/line-chart", async () => {
    await delay(400);

    return HttpResponse.json({
      status: "success",
      data: {
        visualization: "line",
        indexKey: "month",
        series: [
          {
            key: "desktop",
            label: "Desktop",
            color: "var(--chart-1)",
          },
          {
            key: "mobile",
            label: "Mobile",
            color: "var(--chart-4)",
          },
        ],
        data: [
          { month: "Jan", desktop: 186, mobile: 80 },
          { month: "Feb", desktop: 305, mobile: 200 },
          { month: "Mar", desktop: 237, mobile: 120 },
          { month: "Apr", desktop: 73, mobile: 190 },
          { month: "May", desktop: 209, mobile: 130 },
          { month: "Jun", desktop: 214, mobile: 140 },
        ],
      },
    } satisfies PanelCardDataResponse);
  }),

  http.get("/api/gridframe/cards/pie-chart", async () => {
    await delay(450);

    return HttpResponse.json({
      status: "success",
      data: {
        visualization: "pie",
        nameKey: "browser",
        valueKey: "visitors",
        series: [
          { key: "chrome", label: "Chrome", color: "var(--chart-1)" },
          { key: "safari", label: "Safari", color: "var(--chart-2)" },
          { key: "firefox", label: "Firefox", color: "var(--chart-3)" },
          { key: "edge", label: "Edge", color: "var(--chart-4)" },
        ],
        data: [
          { browser: "chrome", visitors: 275 },
          { browser: "safari", visitors: 200 },
          { browser: "firefox", visitors: 187 },
          { browser: "edge", visitors: 173 },
        ],
      },
    } satisfies PanelCardDataResponse);
  }),

  http.get("/api/gridframe/cards/radar-chart", async () => {
    await delay(500);

    return HttpResponse.json({
      status: "success",
      data: {
        visualization: "radar",
        indexKey: "dimension",
        series: [
          {
            key: "current",
            label: "Current",
            color: "var(--chart-1)",
          },
          {
            key: "target",
            label: "Target",
            color: "var(--chart-2)",
          },
        ],
        data: [
          { dimension: "Speed", current: 86, target: 92 },
          { dimension: "Reliability", current: 78, target: 88 },
          { dimension: "Access", current: 92, target: 90 },
          { dimension: "Quality", current: 81, target: 86 },
          { dimension: "Cost", current: 74, target: 82 },
          { dimension: "Support", current: 88, target: 91 },
        ],
      },
    } satisfies PanelCardDataResponse);
  }),

  http.get("/api/gridframe/cards/radial-chart", async () => {
    await delay(550);

    return HttpResponse.json({
      status: "success",
      data: {
        visualization: "radial",
        nameKey: "segment",
        valueKey: "score",
        series: [
          { key: "docs", label: "Docs", color: "var(--chart-1)" },
          { key: "api", label: "API", color: "var(--chart-2)" },
          { key: "examples", label: "Examples", color: "var(--chart-3)" },
          { key: "support", label: "Support", color: "var(--chart-4)" },
        ],
        data: [
          { segment: "docs", score: 82 },
          { segment: "api", score: 68 },
          { segment: "examples", score: 74 },
          { segment: "support", score: 59 },
        ],
      },
    } satisfies PanelCardDataResponse);
  }),
];

export { handlers };
