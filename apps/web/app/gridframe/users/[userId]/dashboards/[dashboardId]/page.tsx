import { DashboardPage } from "../dashboard-page";

async function SelectedDashboardPage({
  params,
}: {
  params: Promise<{ userId: string; dashboardId: string }>;
}) {
  const { userId, dashboardId } = await params;
  return <DashboardPage dashboardId={dashboardId} userId={userId} />;
}

export default SelectedDashboardPage;
