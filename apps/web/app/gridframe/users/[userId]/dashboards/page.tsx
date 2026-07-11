import { DashboardPage } from "./dashboard-page";

async function UserDashboardPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <DashboardPage userId={userId} />;
}

export default UserDashboardPage;
