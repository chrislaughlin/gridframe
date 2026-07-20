"use client";

import { PanelDashboard } from "@gridframe/react";
import { useRouter } from "next/navigation";

type DashboardPageProps = {
  userId: string;
  dashboardId?: string;
};

function DashboardPage({ userId, dashboardId }: DashboardPageProps) {
  const router = useRouter();

  return (
    <PanelDashboard
      dashboard={{
        userId,
        dashboardId,
        onDashboardChange: (nextDashboardId) => {
          router.push(
            `/gridframe/users/${encodeURIComponent(userId)}/dashboards/${encodeURIComponent(nextDashboardId)}`,
          );
        },
      }}
    />
  );
}

export { DashboardPage };
