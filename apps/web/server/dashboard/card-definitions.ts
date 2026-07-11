import { Faker, en } from "@faker-js/faker";
import {
  PanelCardDataResponseSchema,
  type PanelCardDataResponse,
  type TableColumn,
  type TableRow,
  type VisualizationType,
} from "@gridframe/core";

type SourceRecord = Record<string, unknown>;

type CardDefinition = {
  key: string;
  name: string;
  visualization: VisualizationType;
  sourceQuery: string;
  deeplinkLabel: string;
  generateRecords(faker: Faker): SourceRecord[];
  adapt(records: SourceRecord[]): PanelCardDataResponse;
};

const cardDefinitions = defineCards({
  "total-revenue": {
    name: "Total revenue",
    visualization: "metric",
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
    visualization: "bar",
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
    visualization: "table",
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
});

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
  cardDefinitions,
  generateSourceRecords,
  getCardDefinition,
};
export type { CardDefinition, SourceRecord };
