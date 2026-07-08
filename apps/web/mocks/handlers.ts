import { type PanelCardDataResponse } from "@gridframe/react";
import { delay, http, HttpResponse } from "msw";

const handlers = [
  http.get("/api/gridframe/cards/activation-rate", async () => {
    await delay(300);

    return HttpResponse.json({
      status: "success",
      data: {
        visualization: "metric",
        label: "Activated accounts",
        value: "42.8%",
        trend: {
          direction: "up",
          value: "+6.4%",
          label: "from last week",
        },
        helperText: "Measured across accounts that completed onboarding.",
      },
    } satisfies PanelCardDataResponse);
  }),

  http.get("/api/gridframe/cards/active-users", async () => {
    await delay(450);

    return HttpResponse.json({
      status: "success",
      data: {
        visualization: "line",
        indexKey: "week",
        series: [
          {
            key: "activeUsers",
            label: "Active users",
            color: "var(--chart-1)",
          },
          {
            key: "activatedUsers",
            label: "Activated users",
            color: "var(--chart-2)",
          },
        ],
        data: [
          { week: "Jun 1", activeUsers: 1180, activatedUsers: 420 },
          { week: "Jun 8", activeUsers: 1320, activatedUsers: 510 },
          { week: "Jun 15", activeUsers: 1410, activatedUsers: 560 },
          { week: "Jun 22", activeUsers: 1540, activatedUsers: 650 },
          { week: "Jun 29", activeUsers: 1690, activatedUsers: 724 },
        ],
      },
    } satisfies PanelCardDataResponse);
  }),

  http.get("/api/gridframe/cards/acquisition-channel", async () => {
    await delay(400);

    return HttpResponse.json({
      status: "success",
      data: {
        visualization: "bar",
        indexKey: "channel",
        series: [
          {
            key: "signups",
            label: "Signups",
            color: "var(--chart-3)",
          },
        ],
        data: [
          { channel: "Organic", signups: 840 },
          { channel: "Referral", signups: 520 },
          { channel: "Partner", signups: 390 },
          { channel: "Paid", signups: 260 },
        ],
      },
    } satisfies PanelCardDataResponse);
  }),

  http.get("/api/gridframe/cards/top-pages", async () => {
    await delay(350);

    return HttpResponse.json({
      status: "success",
      data: {
        visualization: "table",
        columns: [
          { key: "path", label: "Path" },
          { key: "views", label: "Views", align: "right" },
          { key: "activation", label: "Activation", align: "right" },
        ],
        rows: [
          { path: "/onboarding", views: 18420, activation: "48.2%" },
          { path: "/templates", views: 12950, activation: "36.1%" },
          { path: "/reports", views: 8740, activation: "31.7%" },
          { path: "/settings/team", views: 5120, activation: "22.4%" },
        ],
      },
    } satisfies PanelCardDataResponse);
  }),
];

export { handlers };
