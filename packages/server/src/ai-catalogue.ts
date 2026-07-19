import { AIDataFieldSchema, type AIDataField } from "@gridframe/core";

function defineAIDataFields(fields: readonly AIDataField[]) {
  const parsed = fields.map((field) => AIDataFieldSchema.parse(field));
  const keys = new Set<string>();

  for (const field of parsed) {
    if (keys.has(field.key)) {
      throw new Error(
        `AI data field ${field.key} is registered more than once`,
      );
    }
    keys.add(field.key);
  }

  return parsed.filter((field) => !field.sensitive);
}

export { defineAIDataFields };
