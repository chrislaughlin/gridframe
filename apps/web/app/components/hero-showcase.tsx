"use client";

import { CardVisualization } from "@gridframe/react";
import type { PanelCardPayload } from "@gridframe/core";
import styles from "./hero-showcase.module.css";

function HeroShowcase() {
  return (
    <div className="rounded-xl border border-border bg-card p-1 shadow-sm">
      <div className="rounded-lg border border-border/50 bg-background p-4 sm:p-6">
        <div className="mb-6 space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Live preview
          </p>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Operations overview
          </h3>
        </div>

        <div className={styles.previewGrid}>
          <div className={styles.metricGrid}>
            <HeroCard contentClassName="p-3" name="Revenue">
              <CardVisualization data={metricRevenue} />
            </HeroCard>
            <HeroCard contentClassName="p-3" name="Users">
              <CardVisualization data={metricUsers} />
            </HeroCard>
            <HeroCard contentClassName="p-3" name="Uptime">
              <CardVisualization data={metricUptime} />
            </HeroCard>
          </div>

          <HeroCard className={styles.primaryChart} name="Revenue by Region">
            <CardVisualization data={barData} />
          </HeroCard>

          <HeroCard className={styles.halfWidth} name="Revenue Trend">
            <CardVisualization data={areaData} />
          </HeroCard>

          <HeroCard
            className={`${styles.halfWidth} ${styles.tallChart}`}
            name="Channel Share"
          >
            <CardVisualization data={pieData} />
          </HeroCard>

          <HeroCard className={styles.fullWidth} name="Recent Orders">
            <CardVisualization data={tableData} />
          </HeroCard>
        </div>
      </div>
    </div>
  );
}

function HeroCard({
  name,
  children,
  className = "",
  contentClassName = "p-4",
}: {
  name: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div
      className={`flex min-h-48 flex-col overflow-hidden rounded-lg border border-border bg-card ${className}`}
    >
      <div className="border-b border-border px-4 py-2.5">
        <span className="text-sm font-medium text-card-foreground">
          {name}
        </span>
      </div>
      <div
        className={`flex flex-1 flex-col overflow-hidden ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

const metricRevenue: PanelCardPayload = {
  visualization: "metric",
  value: 128_500,
  label: "Revenue",
  helperText: "Across all channels",
  trend: { direction: "up", value: "12%" },
};

const metricUsers: PanelCardPayload = {
  visualization: "metric",
  value: 3_847,
  label: "Active Users",
  trend: { direction: "up", value: "8.3%" },
};

const metricUptime: PanelCardPayload = {
  visualization: "metric",
  value: "94.2%",
  label: "Uptime",
  trend: { direction: "up", value: "0.4%" },
};

const barData: PanelCardPayload = {
  visualization: "bar",
  indexKey: "region",
  data: [
    { region: "North America", revenue: 62_000 },
    { region: "Europe", revenue: 41_000 },
    { region: "Asia Pacific", revenue: 55_000 },
    { region: "Latin America", revenue: 28_000 },
  ],
  series: [{ key: "revenue", label: "Revenue", color: "var(--chart-1)" }],
  tooltip: { valueFormatter: "currency" },
};

const areaData: PanelCardPayload = {
  visualization: "area",
  indexKey: "month",
  data: [
    { month: "Jan", revenue: 45_000, costs: 32_000 },
    { month: "Feb", revenue: 52_000, costs: 34_000 },
    { month: "Mar", revenue: 48_000, costs: 31_000 },
    { month: "Apr", revenue: 61_000, costs: 35_000 },
    { month: "May", revenue: 55_000, costs: 33_000 },
    { month: "Jun", revenue: 67_000, costs: 36_000 },
  ],
  series: [
    { key: "revenue", label: "Revenue", color: "var(--chart-1)" },
    { key: "costs", label: "Costs", color: "var(--chart-2)" },
  ],
  showLegend: true,
  showGradient: true,
};

const pieData: PanelCardPayload = {
  visualization: "pie",
  nameKey: "source",
  valueKey: "visits",
  data: [
    { source: "Direct", visits: 3_500 },
    { source: "Organic", visits: 4_200 },
    { source: "Social", visits: 2_800 },
    { source: "Referral", visits: 1_500 },
  ],
  series: [
    { key: "Direct", label: "Direct", color: "var(--chart-1)" },
    { key: "Organic", label: "Organic", color: "var(--chart-2)" },
    { key: "Social", label: "Social", color: "var(--chart-3)" },
    { key: "Referral", label: "Referral", color: "var(--chart-4)" },
  ],
  donut: true,
  showLegend: true,
};

const tableData: PanelCardPayload = {
  visualization: "table",
  columns: [
    { key: "order", label: "Order", align: "left" },
    { key: "customer", label: "Customer", align: "left" },
    { key: "amount", label: "Amount", align: "right" },
    { key: "status", label: "Status", align: "left" },
  ],
  rows: [
    {
      order: "ORD-7291",
      customer: "Acme Corp",
      amount: 2_400,
      status: "Delivered",
    },
    {
      order: "ORD-7292",
      customer: "Globex Inc",
      amount: 890,
      status: "Processing",
    },
    {
      order: "ORD-7293",
      customer: "Initech",
      amount: 3_100,
      status: "Shipped",
    },
    {
      order: "ORD-7294",
      customer: "Umbrella Co",
      amount: 1_650,
      status: "Delivered",
    },
  ],
};

export { HeroShowcase };
