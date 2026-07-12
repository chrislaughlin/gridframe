import { type DashboardCardLayout } from "@gridframe/core";
import { type DashboardSeed } from "@gridframe/server";

import { cardDefinitions, type CardDefinition } from "./card-definitions";

type DefaultCardSeed = Pick<CardDefinition, "key"> & {
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
      libraryItemKey: cardDefinitions["total-revenue"].key,
      layout: { x: 0, y: 0, width: 1, height: 2 },
    },
    {
      libraryItemKey: cardDefinitions["revenue-by-region"].key,
      layout: { x: 1, y: 0, width: 3, height: 4 },
    },
    {
      libraryItemKey: cardDefinitions["recent-orders"].key,
      layout: { x: 0, y: 4, width: 4, height: 4 },
    },
  ] satisfies Array<Omit<DefaultCardSeed, "key"> & { libraryItemKey: string }>,
} satisfies DashboardSeed;

export { defaultDashboardSeed };
export type { DefaultCardSeed };
