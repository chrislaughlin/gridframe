import { type DashboardCardLayout } from "@gridframe/core";

import { cardDefinitions, type CardDefinition } from "./card-definitions";

type DefaultCardSeed = CardDefinition & {
  layout: DashboardCardLayout;
};

const defaultDashboardSeed = {
  title: "Operations overview",
  description:
    "A user-owned Gridframe Dashboard backed by the example Dashboard API.",
  footer: {
    text: "Gridframe API-backed dashboard example",
  },
  cards: [
    {
      ...cardDefinitions["total-revenue"],
      layout: { x: 0, y: 0, width: 1, height: 2 },
    },
    {
      ...cardDefinitions["revenue-by-region"],
      layout: { x: 1, y: 0, width: 3, height: 4 },
    },
    {
      ...cardDefinitions["recent-orders"],
      layout: { x: 0, y: 4, width: 4, height: 4 },
    },
  ] satisfies DefaultCardSeed[],
} as const;

export { defaultDashboardSeed };
export type { DefaultCardSeed };
