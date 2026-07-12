import { DashboardDrillDown } from "@gridframe/react";

async function CardDrillDownPage({
  params,
}: {
  params: Promise<{ userId: string; dashboardId: string; cardId: string }>;
}) {
  const identity = await params;
  return <DashboardDrillDown {...identity} />;
}

export default CardDrillDownPage;
