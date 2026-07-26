import type { DashboardAIProviderRequest } from "./ai-provider";

const PROVIDER_JSON_ENVELOPE_SCHEMA = {
  type: "object",
  properties: {
    proposal: {
      type: "string",
      description:
        "The Gridframe Dashboard proposal encoded as a JSON object string.",
    },
  },
  required: ["proposal"],
  additionalProperties: false,
} as const;

async function readProviderResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function providerString(value: unknown, key: string) {
  return isRecord(value) && typeof value[key] === "string"
    ? value[key]
    : undefined;
}

function providerNestedNumber(value: unknown, parent: string, key: string) {
  if (!isRecord(value) || !isRecord(value[parent])) return undefined;
  const nested = value[parent][key];
  return typeof nested === "number" ? nested : undefined;
}

function providerFirstChoiceContent(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.choices)) return undefined;
  const choice = value.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) return undefined;
  return typeof choice.message.content === "string"
    ? choice.message.content
    : undefined;
}

function providerJsonEnvelopeRequest(request: DashboardAIProviderRequest) {
  return {
    userPrompt: `${request.userPrompt}\n\n${JSON.stringify({
      transportInstruction:
        "Return a single object whose proposal property is the stringified JSON Dashboard proposal. The stringified proposal must match dashboardProposalSchema exactly.",
      dashboardProposalSchema: request.jsonSchema,
    })}`,
    jsonSchema: PROVIDER_JSON_ENVELOPE_SCHEMA,
  };
}

function unwrapProviderJsonEnvelope(content: string) {
  try {
    const envelope: unknown = JSON.parse(content);
    return providerString(envelope, "proposal");
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export {
  isRecord,
  providerFirstChoiceContent,
  providerJsonEnvelopeRequest,
  providerNestedNumber,
  providerString,
  readProviderResponseBody,
  unwrapProviderJsonEnvelope,
};
