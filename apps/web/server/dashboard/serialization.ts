import {
  type DashboardBootstrapResponse,
  DashboardDocumentSchema,
  type DashboardDocument,
} from "@gridframe/core";

import { type DashboardBootstrap, type PersistedDashboard } from "./repository";

function serializeDashboardBootstrap(
  result: DashboardBootstrap,
): DashboardBootstrapResponse {
  const { dashboard } = result;
  return {
    dashboards: result.dashboards,
    dashboard: serializeDashboardDocument(dashboard),
  };
}

function serializeDashboardDocument(
  dashboard: PersistedDashboard,
): DashboardDocument {
  const ownerId = encodeURIComponent(dashboard.ownerUserId);
  const dashboardId = encodeURIComponent(dashboard.id);

  return DashboardDocumentSchema.parse({
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
  });
}

export { serializeDashboardBootstrap, serializeDashboardDocument };
