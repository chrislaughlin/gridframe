import {
  DASHBOARD_GRID_COLUMNS,
  type DashboardCardLayout,
} from "@gridframe/core";

function findFirstAvailableDashboardLayout(
  cards: readonly { layout: DashboardCardLayout }[],
  size: { width: number; height: number },
): DashboardCardLayout | undefined {
  if (size.width > DASHBOARD_GRID_COLUMNS) return undefined;

  for (let y = 0; ; y += 1) {
    for (let x = 0; x + size.width <= DASHBOARD_GRID_COLUMNS; x += 1) {
      const candidate = { x, y, ...size };
      if (
        !cards.some((card) => dashboardLayoutsOverlap(candidate, card.layout))
      ) {
        return candidate;
      }
    }
  }
}

function dashboardLayoutsOverlap(
  left: DashboardCardLayout,
  right: DashboardCardLayout,
) {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

export { dashboardLayoutsOverlap, findFirstAvailableDashboardLayout };
