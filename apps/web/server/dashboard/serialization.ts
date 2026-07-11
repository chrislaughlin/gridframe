import {
  DashboardBootstrapResponseSchema,
  type DashboardBootstrapResponse,
} from "@gridframe/core";

import { type DashboardBootstrap } from "./repository";

function serializeDashboardBootstrap(
  result: DashboardBootstrap,
): DashboardBootstrapResponse {
  const { dashboard } = result;
  const ownerId = encodeURIComponent(dashboard.ownerUserId);
  const dashboardId = encodeURIComponent(dashboard.id);

  return DashboardBootstrapResponseSchema.parse({
    dashboards: result.dashboards,
    dashboard: {
      id: dashboard.id,
      revision: String(dashboard.revision),
      config: {
        title: dashboard.title,
        description: dashboard.description,
        footer: dashboard.footer,
        cards: dashboard.cards.map((card) => {
          const cardId = encodeURIComponent(card.id);

          return {
            id: card.id,
            name: card.name,
            visualization: card.visualization,
            query: `/api/gridframe/users/${ownerId}/dashboards/${dashboardId}/cards/${cardId}/data`,
            deeplink: card.deeplink
              ? {
                  href: `/gridframe/users/${ownerId}/dashboards/${dashboardId}/cards/${cardId}`,
                  label: card.deeplink.label,
                }
              : undefined,
            layout: card.layout,
          };
        }),
      },
    },
  });
}

export { serializeDashboardBootstrap };
