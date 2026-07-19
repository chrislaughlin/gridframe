import { Faker, en } from "@faker-js/faker";
import {
  type DashboardCardDataConfig,
  type DashboardFilter,
  type DashboardGlobalFilter,
  PanelCardDataResponseSchema,
  type PanelCardDataResponse,
  type TableColumn,
  type TableRow,
} from "@gridframe/core";
import {
  defineCards as defineGridframeCards,
  type CardAIMetadata,
  type CardDefinition as GridframeCardDefinition,
} from "@gridframe/server";

type SourceRecord = Record<string, unknown>;

type CardDefinition = GridframeCardDefinition & {
  key: string;
  description: string;
  sourceQuery: string;
  deeplinkLabel: string;
  generateRecords(
    faker: Faker,
    dataConfig?: DashboardCardDataConfig,
  ): SourceRecord[];
  adapt(
    records: SourceRecord[],
    dataConfig?: DashboardCardDataConfig,
  ): PanelCardDataResponse;
};

type CardDefinitionInput = Omit<
  CardDefinition,
  "key" | "resolve" | "sourceQuery"
>;

const cards = defineExampleCards({
  "total-revenue": {
    name: "Total revenue",
    description: "A headline revenue metric calculated from example orders.",
    visualization: "metric",
    defaultLayout: { width: 1, height: 2 },
    deeplinkLabel: "View revenue source data",
    ai: {
      tags: ["sales", "revenue", "kpi"],
      questionsAnswered: ["What is total revenue?"],
      requiredDataShape: {
        minMetrics: 1,
        maxMetrics: 1,
        minDimensions: 0,
        maxDimensions: 0,
        supportsTimeSeries: false,
      },
      supportedFilters: ["equals", "in", "between"],
    },
    generateRecords: (faker) =>
      Array.from({ length: 48 }, () => syntheticMeasures(faker)),
    adapt: (records, dataConfig) => ({
      status: "success",
      data: {
        visualization: "metric",
        value: aggregateRecords(
          records,
          dataConfig?.metrics?.[0] ?? { field: "revenue", aggregation: "sum" },
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
    ai: {
      tags: ["sales", "revenue", "region", "comparison"],
      questionsAnswered: ["How does revenue compare by region?"],
      requiredDataShape: {
        minMetrics: 1,
        maxMetrics: 1,
        minDimensions: 1,
        maxDimensions: 1,
        supportsTimeSeries: false,
      },
      supportedFilters: ["equals", "in", "between"],
    },
    generateRecords: (faker) =>
      ["North", "South", "East", "West"].map((region) => ({
        ...syntheticMeasures(faker),
        region,
      })),
    adapt: (records, dataConfig) => {
      const dimension = dataConfig?.dimensions?.[0] ?? "region";
      const metric =
        dataConfig?.metrics?.[0]?.alias ??
        dataConfig?.metrics?.[0]?.field ??
        "revenue";
      const sourceMetric = dataConfig?.metrics?.[0]?.field ?? "revenue";
      const metricConfig = dataConfig?.metrics?.[0];
      return {
        status: "success",
        data: {
          visualization: "bar",
          indexKey: dimension,
          data: records.map((record) => ({
            [dimension]: stringValue(record[dimension]),
            [metric]: metricRecordValue(record, sourceMetric, metricConfig),
          })),
          series: [
            {
              key: metric,
              label: metricLabel(dataConfig?.metrics?.[0], "Revenue"),
              color: "var(--chart-1)",
            },
          ],
          tooltip: { valueFormatter: "currency" },
        },
      };
    },
  },
  "recent-orders": {
    name: "Recent orders",
    description: "The latest example orders in a table Visualization.",
    visualization: "table",
    defaultLayout: { width: 4, height: 4 },
    deeplinkLabel: "View order source data",
    ai: {
      tags: ["sales", "orders", "records", "recent"],
      questionsAnswered: ["What are the most recent orders?"],
      requiredDataShape: {
        minMetrics: 0,
        maxMetrics: 4,
        minDimensions: 1,
        maxDimensions: 8,
        supportsTimeSeries: true,
      },
      supportedFilters: [
        "equals",
        "notEquals",
        "in",
        "notIn",
        "between",
        "contains",
      ],
    },
    generateRecords: (faker) =>
      Array.from({ length: 24 }, (_, index) => ({
        ...syntheticMeasures(faker),
        order_id: faker.string.alphanumeric({ length: 8 }).toUpperCase(),
        customer: faker.person.fullName(),
        created_at: monthLabel(24 - index),
      })),
    adapt: (records, dataConfig) => {
      const selectedFields = [
        ...(dataConfig?.dimensions ?? []),
        ...(dataConfig?.metrics?.map((metric) => metric.field) ?? []),
        ...(dataConfig?.time ? [dataConfig.time.field] : []),
      ];
      const rows = records.map((record) =>
        toTableRow(
          selectedFields.length
            ? Object.fromEntries(
                selectedFields.map((field) => [field, record[field]]),
              )
            : record,
        ),
      );
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
  "total-orders": metricDefinition(
    "Total orders",
    "A headline count of ecommerce orders.",
    "Orders",
    "order_id",
    "count",
  ),
  "average-order-value": metricDefinition(
    "Average order value",
    "Average revenue per ecommerce order.",
    "Order value",
    "order_value",
    "currency",
  ),
  "refund-rate": metricDefinition(
    "Refund rate",
    "The percentage of orders that were refunded.",
    "Refund rate",
    "refund_rate",
    "percent",
  ),
  "orders-by-status": comparisonDefinition(
    "Orders by status",
    "Order volume grouped by fulfilment status.",
    "order_status",
    "order_id",
  ),
  "top-products": comparisonDefinition(
    "Top products",
    "Products ranked by revenue.",
    "product",
    "revenue",
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

const {
  aiCardLibrary,
  cardLibrary,
  definitions: cardDefinitions,
  resolveCardData,
} = cards;
const resolveExampleCardData = resolveCardData;

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
    ...(visualization === "radar"
      ? {}
      : {
          ai: {
            tags: ["trend", "time series"],
            questionsAnswered: [
              `How is ${name.toLowerCase()} changing over time?`,
            ],
            requiredDataShape: {
              minMetrics: 1,
              maxMetrics: 2,
              minDimensions: 0,
              maxDimensions: 1,
              supportsTimeSeries: true,
            },
            supportedFilters: [
              "equals",
              "in",
              "between",
            ] as CardAIMetadata["supportedFilters"],
          },
        }),
    generateRecords: (faker: Faker, dataConfig?: DashboardCardDataConfig) => {
      const timeKey = dataConfig?.time?.field ?? "created_at";
      const grain = dataConfig?.time?.grain ?? "month";
      const count = timePeriodCount(dataConfig?.time?.range, grain);
      return Array.from({ length: count }, (_, index) => ({
        ...syntheticMeasures(faker),
        [timeKey]: timePeriodLabel(count - index, grain),
      }));
    },
    adapt: (records: SourceRecord[], dataConfig?: DashboardCardDataConfig) => {
      const timeKey = dataConfig?.time?.field ?? "created_at";
      const metrics = dataConfig?.metrics?.length
        ? dataConfig.metrics
        : [{ field: "revenue", aggregation: "sum" as const }];
      return {
        status: "success" as const,
        data: {
          visualization,
          indexKey: timeKey,
          data: records.map((record) => ({
            [timeKey]: stringValue(record[timeKey]),
            ...Object.fromEntries(
              metrics.map((metric) => [
                metric.alias ?? metric.field,
                metricRecordValue(record, metric.field, metric),
              ]),
            ),
          })),
          series: metrics.map((metric, index) => ({
            key: metric.alias ?? metric.field,
            label: metricLabel(metric),
            color: `var(--chart-${index + 1})`,
          })),
        },
      };
    },
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
    ...(visualization === "radial"
      ? {}
      : {
          ai: {
            tags: ["share", "category", "composition"],
            questionsAnswered: [`What makes up ${name.toLowerCase()}?`],
            requiredDataShape: {
              minMetrics: 1,
              maxMetrics: 1,
              minDimensions: 1,
              maxDimensions: 1,
              supportsTimeSeries: false,
            },
            supportedFilters: [
              "equals",
              "in",
              "between",
            ] as CardAIMetadata["supportedFilters"],
          },
        }),
    generateRecords: (faker: Faker, dataConfig?: DashboardCardDataConfig) => {
      const dimension = dataConfig?.dimensions?.[0] ?? "channel";
      return categoryValues(dimension).map((category) => ({
        ...syntheticMeasures(faker),
        [dimension]: category,
      }));
    },
    adapt: (records: SourceRecord[], dataConfig?: DashboardCardDataConfig) => {
      const dimension = dataConfig?.dimensions?.[0] ?? "channel";
      const metricConfig = dataConfig?.metrics?.[0] ?? {
        field: "revenue",
        aggregation: "sum" as const,
      };
      const metric = metricConfig.alias ?? metricConfig.field;
      return {
        status: "success" as const,
        data: {
          visualization,
          nameKey: dimension,
          valueKey: metric,
          data: records.map((record) => ({
            [dimension]: stringValue(record[dimension]),
            [metric]: metricRecordValue(
              record,
              metricConfig.field,
              metricConfig,
            ),
          })),
          series: records.map((record, index) => ({
            key: stringValue(record[dimension]),
            label: stringValue(record[dimension]),
            color: `var(--chart-${index + 1})`,
          })),
        },
      };
    },
  };
}

function metricDefinition(
  name: string,
  description: string,
  label: string,
  field: string,
  format: "count" | "currency" | "percent",
) {
  return {
    name,
    description,
    visualization: "metric" as const,
    deeplinkLabel: `View ${name.toLowerCase()} source data`,
    defaultLayout: { width: 1, height: 2 },
    ai: {
      tags: ["sales", "orders", "kpi"],
      questionsAnswered: [`What is ${name.toLowerCase()}?`],
      requiredDataShape: {
        minMetrics: 1,
        maxMetrics: 1,
        minDimensions: 0,
        maxDimensions: 0,
        supportsTimeSeries: false,
      },
      supportedFilters: [
        "equals",
        "in",
        "between",
      ] as CardAIMetadata["supportedFilters"],
    },
    generateRecords: (faker: Faker) =>
      Array.from({ length: 48 }, () => syntheticMeasures(faker)),
    adapt: (records: SourceRecord[], dataConfig?: DashboardCardDataConfig) => {
      const metric = dataConfig?.metrics?.[0] ?? {
        field,
        aggregation:
          format === "count" ? ("count" as const) : ("average" as const),
      };
      const value = aggregateRecords(records, metric);
      return {
        status: "success" as const,
        data: {
          visualization: "metric" as const,
          value:
            format === "currency"
              ? `$${value.toFixed(2)}`
              : format === "percent"
                ? `${(value * 100).toFixed(1)}%`
                : value,
          label,
        },
      };
    },
  };
}

function comparisonDefinition(
  name: string,
  description: string,
  dimensionKey: string,
  metricKey: string,
) {
  const categories =
    dimensionKey === "order_status"
      ? ["Processing", "Shipped", "Delivered", "Refunded"]
      : [
          "Notebook",
          "Headphones",
          "Backpack",
          "Keyboard",
          "Camera",
          "Speaker",
          "Monitor",
          "Mouse",
          "Desk lamp",
          "Webcam",
          "Microphone",
          "Tablet stand",
        ];
  return {
    name,
    description,
    visualization: "bar" as const,
    deeplinkLabel: `View ${name.toLowerCase()} source data`,
    defaultLayout: { width: 2, height: 4 },
    ai: {
      tags: ["sales", "orders", "comparison"],
      questionsAnswered: [`How does ${metricKey} compare by ${dimensionKey}?`],
      requiredDataShape: {
        minMetrics: 1,
        maxMetrics: 1,
        minDimensions: 1,
        maxDimensions: 1,
        supportsTimeSeries: false,
      },
      supportedFilters: [
        "equals",
        "in",
        "between",
      ] as CardAIMetadata["supportedFilters"],
    },
    generateRecords: (faker: Faker) =>
      categories.map((category) => ({
        ...syntheticMeasures(faker),
        [dimensionKey]: category,
      })),
    adapt: (records: SourceRecord[], dataConfig?: DashboardCardDataConfig) => {
      const dimension = dataConfig?.dimensions?.[0] ?? dimensionKey;
      const metric =
        dataConfig?.metrics?.[0]?.alias ??
        dataConfig?.metrics?.[0]?.field ??
        metricKey;
      const sourceMetric = dataConfig?.metrics?.[0]?.field ?? metricKey;
      const metricConfig = dataConfig?.metrics?.[0];
      return {
        status: "success" as const,
        data: {
          visualization: "bar" as const,
          indexKey: dimension,
          data: records.map((record) => ({
            [dimension]: stringValue(record[dimension]),
            [metric]: metricRecordValue(record, sourceMetric, metricConfig),
          })),
          series: [
            {
              key: metric,
              label: metricLabel(dataConfig?.metrics?.[0]),
              color: "var(--chart-1)",
            },
          ],
        },
      };
    },
  };
}

function defineExampleCards<
  const T extends Record<string, CardDefinitionInput>,
>(definitions: T) {
  const registry = defineGridframeCards(
    Object.fromEntries(
      Object.entries(definitions).map(([key, definition]) => [
        key,
        {
          ...definition,
          sourceQuery: `/api/consumer/cards/${key}`,
          resolve: ({ request, card, globalFilters }) =>
            resolveDefinitionData(
              key,
              definition,
              request,
              card.data,
              globalFilters,
            ),
        },
      ]),
    ) as Record<string, CardDefinitionInput & GridframeCardDefinition>,
  );

  return {
    ...registry,
    aiCardLibrary: registry.aiCardLibrary.map((card) => ({
      ...card,
      requiredPermissions: ["dashboard:read"],
    })),
    definitions: registry.definitions as {
      [K in keyof T]: CardDefinition & { key: K };
    },
  };
}

function resolveDefinitionData(
  key: string,
  definition: CardDefinitionInput,
  request: Request,
  configuredDataConfig?: DashboardCardDataConfig,
  globalFilters: readonly DashboardGlobalFilter[] = [],
): PanelCardDataResponse {
  const dataConfig = configuredDataConfig ?? defaultDataConfigForCard(key);
  const faker = new Faker({ locale: [en] });
  faker.seed(hashSourceKey(key));
  const records = applyDataConfig(
    definition.generateRecords(faker, dataConfig),
    dataConfig,
    globalFilters,
  );
  const adapted = adaptSourceRecords(definition, records, dataConfig);

  if (
    new URL(request.url).searchParams.get("includeSource") === "true" &&
    adapted.status === "success"
  ) {
    return {
      ...adapted,
      sourceData: normalizeSourceTable(records.map(withoutInternalFields)),
    };
  }

  return adapted;
}

function withoutInternalFields(record: SourceRecord) {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => !key.startsWith("__")),
  );
}

function getCardDefinition(key: string | undefined) {
  return key && key in cardDefinitions
    ? cardDefinitions[key as keyof typeof cardDefinitions]
    : undefined;
}

function generateSourceRecords(definition: CardDefinition) {
  const faker = new Faker({ locale: [en] });
  faker.seed(hashSourceKey(definition.key));
  return definition.generateRecords(
    faker,
    defaultDataConfigForCard(definition.key),
  );
}

function adaptSourceRecords(
  definition: Pick<CardDefinition, "adapt">,
  records: SourceRecord[],
  dataConfig?: DashboardCardDataConfig,
) {
  if (records.length === 0) {
    return { status: "empty", message: "This Card has no data yet." } as const;
  }
  return PanelCardDataResponseSchema.parse(
    definition.adapt(records, dataConfig),
  );
}

function defaultDataConfigForCard(key: string): DashboardCardDataConfig {
  const dataConfigs: Record<string, DashboardCardDataConfig> = {
    "total-revenue": {
      metrics: [{ field: "revenue", aggregation: "sum" }],
    },
    "revenue-by-region": {
      metrics: [{ field: "revenue", aggregation: "sum" }],
      dimensions: ["region"],
    },
    "recent-orders": {
      dimensions: [
        "order_id",
        "order_status",
        "product",
        "region",
        "order_value",
        "created_at",
      ],
      sort: [{ field: "created_at", direction: "desc" }],
      limit: 8,
    },
    "revenue-trend": {
      metrics: [{ field: "revenue", aggregation: "sum" }],
      time: { field: "created_at", range: "last 6 months", grain: "month" },
    },
    "total-orders": {
      metrics: [{ field: "order_id", aggregation: "count" }],
    },
    "average-order-value": {
      metrics: [{ field: "order_value", aggregation: "average" }],
    },
    "refund-rate": {
      metrics: [{ field: "refund_rate", aggregation: "average" }],
    },
    "orders-by-status": {
      metrics: [{ field: "order_id", aggregation: "count" }],
      dimensions: ["order_status"],
    },
    "top-products": {
      metrics: [{ field: "revenue", aggregation: "sum" }],
      dimensions: ["product"],
      sort: [{ field: "revenue", direction: "desc" }],
      limit: 5,
    },
    "orders-trend": {
      metrics: [{ field: "order_id", aggregation: "count" }],
      time: { field: "created_at", range: "last 6 months", grain: "month" },
    },
    "channel-share": {
      metrics: [{ field: "revenue", aggregation: "sum" }],
      dimensions: ["channel"],
    },
  };
  return dataConfigs[key] ?? {};
}

function applyDataConfig(
  records: SourceRecord[],
  dataConfig: DashboardCardDataConfig,
  globalFilters: readonly DashboardGlobalFilter[],
) {
  const filters: DashboardFilter[] = [
    ...(dataConfig.filters ?? []),
    ...globalFilters.flatMap((filter) =>
      filter.value === undefined
        ? []
        : [
            {
              field: filter.field,
              operator: filter.operator,
              value: filter.value,
            },
          ],
    ),
  ];
  let result = records.filter((record) =>
    filters.every((filter) => matchesFilter(record, filter)),
  );
  if (dataConfig.time?.range) {
    const grain = dataConfig.time.grain ?? "month";
    const periods = timePeriodCount(dataConfig.time.range, grain);
    const oldest = timePeriodLabel(periods, grain);
    result = result.filter((record) => {
      const value = record[dataConfig.time!.field];
      return typeof value !== "string" || value >= oldest;
    });
  }
  for (const sort of [...(dataConfig.sort ?? [])].reverse()) {
    result = [...result].sort((left, right) => {
      const comparison = compareValues(left[sort.field], right[sort.field]);
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }
  return dataConfig.limit === undefined
    ? result
    : result.slice(0, dataConfig.limit);
}

function matchesFilter(record: SourceRecord, filter: DashboardFilter) {
  const actual = record[filter.field];
  const expected = filter.value;
  switch (filter.operator) {
    case "equals":
      return actual === expected;
    case "notEquals":
      return actual !== expected;
    case "in":
      return Array.isArray(expected) && expected.includes(actual as never);
    case "notIn":
      return Array.isArray(expected) && !expected.includes(actual as never);
    case "greaterThan":
      return compareValues(actual, expected) > 0;
    case "greaterThanOrEqual":
      return compareValues(actual, expected) >= 0;
    case "lessThan":
      return compareValues(actual, expected) < 0;
    case "lessThanOrEqual":
      return compareValues(actual, expected) <= 0;
    case "between":
      return (
        Array.isArray(expected) &&
        expected.length === 2 &&
        compareValues(actual, expected[0]) >= 0 &&
        compareValues(actual, expected[1]) <= 0
      );
    case "contains":
      return (
        typeof actual === "string" &&
        typeof expected === "string" &&
        actual.toLowerCase().includes(expected.toLowerCase())
      );
  }
}

function compareValues(left: unknown, right: unknown) {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  return String(left).localeCompare(String(right));
}

function syntheticMeasures(faker: Faker): SourceRecord {
  return {
    revenue: faker.number.int({ min: 4_000, max: 80_000 }),
    order_value: faker.number.float({
      min: 50,
      max: 2_000,
      fractionDigits: 2,
    }),
    refund_rate: faker.number.float({
      min: 0.01,
      max: 0.12,
      fractionDigits: 3,
    }),
    order_id: faker.string.alphanumeric({ length: 8 }).toUpperCase(),
    __count: faker.number.int({ min: 20, max: 2_000 }),
    order_status: faker.helpers.arrayElement([
      "Processing",
      "Shipped",
      "Delivered",
      "Refunded",
    ]),
    product: faker.helpers.arrayElement([
      "Notebook",
      "Headphones",
      "Backpack",
      "Keyboard",
      "Camera",
    ]),
    region: faker.helpers.arrayElement(["North", "South", "East", "West"]),
    channel: faker.helpers.arrayElement(["Direct", "Partner", "Organic"]),
    created_at: monthLabel(faker.number.int({ min: 1, max: 24 })),
  };
}

function aggregateRecords(
  records: SourceRecord[],
  metric: NonNullable<DashboardCardDataConfig["metrics"]>[number],
) {
  const rawValues = records.map(
    (record) => record[metric.field] ?? record.amount,
  );
  if (metric.aggregation === "count") {
    return records.reduce(
      (sum, record, index) =>
        sum +
        (typeof record.__count === "number"
          ? record.__count
          : rawValues[index] === undefined || rawValues[index] === null
            ? 0
            : 1),
      0,
    );
  }
  const values = rawValues.map(numberValue);
  if (!values.length) return 0;
  switch (metric.aggregation) {
    case "average":
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    case "sum":
    case undefined:
      return values.reduce((sum, value) => sum + value, 0);
  }
}

function metricRecordValue(
  record: SourceRecord,
  field: string,
  metric: NonNullable<DashboardCardDataConfig["metrics"]>[number] | undefined,
) {
  return metric?.aggregation === "count"
    ? numberValue(record.__count ?? 1)
    : numberValue(record[field]);
}

function metricLabel(
  metric: NonNullable<DashboardCardDataConfig["metrics"]>[number] | undefined,
  fallback?: string,
) {
  return (
    metric?.alias ??
    fallback ??
    metric?.field
      ?.replaceAll("_", " ")
      .replace(/^./, (character) => character.toUpperCase()) ??
    "Value"
  );
}

function monthLabel(monthsAgo: number) {
  return timePeriodLabel(monthsAgo, "month");
}

type DashboardTimeGrain = NonNullable<
  NonNullable<DashboardCardDataConfig["time"]>["grain"]
>;

const periodsPerYear: Record<DashboardTimeGrain, number> = {
  hour: 24 * 365,
  day: 365,
  week: 52,
  month: 12,
  quarter: 4,
  year: 1,
};

function timePeriodCount(range: string | undefined, grain: DashboardTimeGrain) {
  const match = range?.match(
    /(\d+)\s+(hours?|days?|weeks?|months?|quarters?|years?)/i,
  );
  if (!match) return 6;
  const sourceUnit = match[2]?.toLowerCase().replace(/s$/, "") as
    | DashboardTimeGrain
    | undefined;
  const sourcePeriodsPerYear = sourceUnit
    ? periodsPerYear[sourceUnit]
    : undefined;
  const sourceCount = Number(match[1]);
  const count = sourcePeriodsPerYear
    ? Math.ceil((sourceCount * periodsPerYear[grain]) / sourcePeriodsPerYear)
    : sourceCount;
  return Math.min(Math.max(count, 1), 60);
}

function timePeriodLabel(periodsAgo: number, grain: DashboardTimeGrain) {
  const date = new Date(Date.UTC(2026, 6, 1));
  switch (grain) {
    case "hour":
      date.setUTCHours(date.getUTCHours() - periodsAgo);
      return `${date.toISOString().slice(0, 13)}:00`;
    case "day":
      date.setUTCDate(date.getUTCDate() - periodsAgo);
      return date.toISOString().slice(0, 10);
    case "week":
      date.setUTCDate(date.getUTCDate() - periodsAgo * 7);
      return date.toISOString().slice(0, 10);
    case "month":
      date.setUTCMonth(date.getUTCMonth() - periodsAgo);
      return date.toISOString().slice(0, 7);
    case "quarter": {
      date.setUTCMonth(date.getUTCMonth() - periodsAgo * 3);
      return `${date.getUTCFullYear()}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
    }
    case "year":
      return String(date.getUTCFullYear() - periodsAgo);
  }
}

function categoryValues(field: string) {
  const values: Record<string, string[]> = {
    channel: ["Direct", "Partner", "Organic"],
    order_status: ["Processing", "Shipped", "Delivered", "Refunded"],
    product: ["Notebook", "Headphones", "Backpack", "Keyboard", "Camera"],
    region: ["North", "South", "East", "West"],
  };
  return values[field] ?? ["Group A", "Group B", "Group C"];
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
  aiCardLibrary,
  adaptSourceRecords,
  cardLibrary,
  cardDefinitions,
  generateSourceRecords,
  getCardDefinition,
  normalizeSourceTable,
  resolveExampleCardData,
};
export type { CardDefinition, SourceRecord };
