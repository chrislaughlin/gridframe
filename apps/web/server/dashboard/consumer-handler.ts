import { generateSourceRecords, getCardDefinition } from "./card-definitions";

function createConsumerCardHandler() {
  return async function consumerCardData(sourceKey: string): Promise<Response> {
    const definition = getCardDefinition(sourceKey);
    if (!definition) {
      return Response.json({ error: "Source not found" }, { status: 404 });
    }

    return Response.json({ records: generateSourceRecords(definition) });
  };
}

export { createConsumerCardHandler };
