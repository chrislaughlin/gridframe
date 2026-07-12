import { Faker, en } from "@faker-js/faker";
import {
  PanelCardDataResponseSchema,
  type PanelCardDataResponse,
  type TableColumn,
  type TableRow,
  type VisualizationType,
} from "@gridframe/core";
import { type CardDataResolverInput } from "@gridframe/server";

type SourceRecord = Record<string, unknown>;

type CardDefinition = {
  key: string;
  name: string;
  description: string;
  visualization: VisualizationType;
  sourceQuery: string;
  deeplinkLabel: string;
  defaultLayout: { width: number; height: number };
  generateRecords(faker: Faker): SourceRecord[];
  adapt(records: SourceRecord[]): PanelCardDataResponse;
};

const cardDefinitions = defineCards({
  "total-revenue": {
    name: "Total revenue",
    description: "A headline revenue metric calculated from example orders.",
    visualization: "metric",
    defaultLayout: { width: 1, height: 2 },
    deeplinkLabel: "View revenue source data",
    generateRecords: (faker) =>
      Array.from({ length: 12 }, () => ({
        amount: faker.number.int({ min: 4_000, max: 18_000 }),
      })),
    adapt: (records) => ({
      status: "success",
      data: {
        visualization: "metric",
        value: records.reduce(
          (sum, record) => sum + numberValue(record.amount),
          0,
        ),
        label: "Revenue",
        helperText: "Across all example orders",
      },
    }),
  },
  "revenue-by-region": {
    name: "Revenue by region",
    description: "Regional revenue compared in a bar Visualization.",
    visualization: "bar",
    defaultLayout: { width: 3, height: 4 },
    deeplinkLabel: "View regional revenue source data",
    generateRecords: (faker) =>
      ["North", "South", "East", "West"].map((region) => ({
        region,
        revenue: faker.number.int({ min: 20_000, max: 80_000 }),
      })),
    adapt: (records) => ({
      status: "success",
      data: {
        visualization: "bar",
        indexKey: "region",
        data: records.map((record) => ({
          region: stringValue(record.region),
          revenue: numberValue(record.revenue),
        })),
        series: [
          {
            key: "revenue",
            label: "Revenue",
            color: "var(--chart-1)",
          },
        ],
        tooltip: { valueFormatter: "currency" },
      },
    }),
  },
  "recent-orders": {
    name: "Recent orders",
    description: "The latest example orders in a table Visualization.",
    visualization: "table",
    defaultLayout: { width: 4, height: 4 },
    deeplinkLabel: "View order source data",
    generateRecords: (faker) =>
      Array.from({ length: 8 }, () => ({
        orderId: faker.string.alphanumeric({ length: 8 }).toUpperCase(),
        customer: faker.person.fullName(),
        total: faker.number.float({ min: 50, max: 2_000, fractionDigits: 2 }),
        status: faker.helpers.arrayElement([
          "Processing",
          "Shipped",
          "Delivered",
        ]),
      })),
    adapt: (records) => {
      const rows = records.map(toTableRow);
      return {
        status: "success",
        data: {
          visualization: "table",
          columns: tableColumns(rows[0] ?? {}),
          rows,
        },
      };
    },
  },
  "revenue-trend": chartDefinition(
    "Revenue trend",
    "Monthly revenue shown as an area Visualization.",
    "area",
  ),
  "orders-trend": chartDefinition(
    "Orders trend",
    "Monthly order volume shown as a line Visualization.",
    "line",
  ),
  "channel-share": categoryDefinition(
    "Channel share",
    "Revenue share shown as a pie Visualization.",
    "pie",
  ),
  "team-performance": chartDefinition(
    "Team performance",
    "Team performance shown as a radar Visualization.",
    "radar",
  ),
  "goal-progress": categoryDefinition(
    "Goal progress",
    "Goal progress shown as a radial Visualization.",
    "radial",
  ),
});

const cardLibrary = Object.values(cardDefinitions).map((definition) => ({
  key: definition.key,
  name: definition.name,
  description: definition.description,
  visualization: definition.visualization,
  defaultLayout: definition.defaultLayout,
  deeplinkLabel: definition.deeplinkLabel,
}));

function resolveExampleCardData({
  card,
  request,
}: CardDataResolverInput): PanelCardDataResponse {
  const definition = getCardDefinition(card.libraryItemKey);
  if (!definition || definition.visualization !== card.visualization) {
    throw new Error("Card definition is not available");
  }

  const records = generateSourceRecords(definition);
  const adapted = adaptSourceRecords(definition, records);
  if (
    new URL(request.url).searchParams.get("includeSource") === "true" &&
    adapted.status === "success"
  ) {
    return {
      ...adapted,
      sourceData: normalizeSourceTable(records),
    };
  }

  return adapted;
}

function chartDefinition(
  name: string,
  description: string,
  visualization: "area" | "line" | "radar",
) {
  return {
    name,
    description,
    visualization,
    deeplinkLabel: `View ${name.toLowerCase()} source data`,
    defaultLayout: { width: 2, height: 4 },
    generateRecords: (faker: Faker) =>
      ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => ({
        month,
        value: faker.number.int({ min: 20, max: 100 }),
      })),
    adapt: (records: SourceRecord[]) => ({
      status: "success" as const,
      data: {
        visualization,
        indexKey: "month",
        data: records.map((record) => ({
          month: stringValue(record.month),
          value: numberValue(record.value),
        })),
        series: [{ key: "value", label: "Value", color: "var(--chart-1)" }],
      },
    }),
  };
}

function categoryDefinition(
  name: string,
  description: string,
  visualization: "pie" | "radial",
) {
  return {
    name,
    description,
    visualization,
    deeplinkLabel: `View ${name.toLowerCase()} source data`,
    defaultLayout: { width: 2, height: 4 },
    generateRecords: (faker: Faker) =>
      ["Direct", "Partner", "Organic"].map((channel) => ({
        channel,
        value: faker.number.int({ min: 20, max: 100 }),
      })),
    adapt: (records: SourceRecord[]) => ({
      status: "success" as const,
      data: {
        visualization,
        nameKey: "channel",
        valueKey: "value",
        data: records.map((record) => ({
          channel: stringValue(record.channel),
          value: numberValue(record.value),
        })),
        series: records.map((record, index) => ({
          key: stringValue(record.channel),
          label: stringValue(record.channel),
          color: `var(--chart-${index + 1})`,
        })),
      },
    }),
  };
}

function defineCards<
  T extends Record<string, Omit<CardDefinition, "key" | "sourceQuery">>,
>(definitions: T) {
  return Object.fromEntries(
    Object.entries(definitions).map(([key, definition]) => [
      key,
      {
        ...definition,
        key,
        sourceQuery: `/api/consumer/cards/${key}`,
      },
    ]),
  ) as { [K in keyof T]: CardDefinition & { key: K } };
}

function getCardDefinition(key: string | undefined) {
  return key && key in cardDefinitions
    ? cardDefinitions[key as keyof typeof cardDefinitions]
    : undefined;
}

function generateSourceRecords(definition: CardDefinition) {
  const faker = new Faker({ locale: [en] });
  faker.seed(hashSourceKey(definition.key));
  return definition.generateRecords(faker);
}

function adaptSourceRecords(
  definition: CardDefinition,
  records: SourceRecord[],
) {
  if (records.length === 0) {
    return { status: "empty", message: "This Card has no data yet." } as const;
  }
  return PanelCardDataResponseSchema.parse(definition.adapt(records));
}

function toTableRow(record: SourceRecord): TableRow {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      typeof value === "string" || typeof value === "number" || value === null
        ? value
        : String(value),
    ]),
  );
}

function tableColumns(row: TableRow): TableColumn[] {
  return Object.keys(row).map((key) => ({
    key,
    label: key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (character) => character.toUpperCase()),
    align: typeof row[key] === "number" ? "right" : "left",
  }));
}

function normalizeSourceTable(records: SourceRecord[]) {
  const rows = records.map(toTableRow);
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const sample = Object.fromEntries(
    keys.map((key) => [
      key,
      rows.find((row) => row[key] !== undefined)?.[key] ?? null,
    ]),
  );
  return { columns: tableColumns(sample), rows };
}

function numberValue(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("Expected a finite number");
  }
  return value;
}

function stringValue(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("Expected a string");
  }
  return value;
}

function hashSourceKey(value: string) {
  return [...value].reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
}

export {
  adaptSourceRecords,
  cardLibrary,
  cardDefinitions,
  generateSourceRecords,
  getCardDefinition,
  normalizeSourceTable,
  resolveExampleCardData,
};
export type { CardDefinition, SourceRecord };
