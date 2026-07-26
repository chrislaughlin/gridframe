import type {
  DashboardAIProvider,
  DashboardAIProviderRequest,
  DashboardAIProviderResponse,
} from "./ai-provider";
import {
  providerFirstChoiceContent,
  providerJsonEnvelopeRequest,
  providerNestedNumber,
  providerString,
  readProviderResponseBody,
  unwrapProviderJsonEnvelope,
} from "./provider-http";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

type OpenAICompatibleProviderOptions = {
  baseUrl: string;
  model: string;
  apiKey?: string;
  schemaMode?: "direct" | "json-envelope";
  reasoningEffort?: OpenAIReasoningEffort;
  temperature?: number | null;
  headers?: HeadersInit;
  fetch?: typeof fetch;
};

type OpenAIProviderOptions = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  reasoningEffort?: OpenAIReasoningEffort;
  temperature?: number | null;
  headers?: HeadersInit;
  fetch?: typeof fetch;
};

type OpenAIReasoningEffort =
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

class OpenAICompatibleProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAICompatibleProviderError";
  }
}

class OpenAICompatibleDashboardAIProvider implements DashboardAIProvider {
  readonly model: string;
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly schemaMode: "direct" | "json-envelope";
  private readonly reasoningEffort?: OpenAIReasoningEffort;
  private readonly temperature?: number;
  private readonly headers?: HeadersInit;
  private readonly fetchImplementation: typeof fetch;

  constructor(options: OpenAICompatibleProviderOptions) {
    if (!options.baseUrl.trim()) {
      throw new Error("An OpenAI-compatible base URL is required");
    }
    if (!options.model.trim()) {
      throw new Error("An OpenAI-compatible model is required");
    }
    if (
      options.temperature !== undefined &&
      options.temperature !== null &&
      (!Number.isFinite(options.temperature) ||
        options.temperature < 0 ||
        options.temperature > 2)
    ) {
      throw new Error("OpenAI-compatible temperature must be between 0 and 2");
    }
    this.apiKey = options.apiKey?.trim() || undefined;
    this.model = options.model;
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.schemaMode = options.schemaMode ?? "json-envelope";
    this.reasoningEffort = options.reasoningEffort;
    this.temperature =
      options.temperature === null ||
      (options.temperature === undefined &&
        options.reasoningEffort !== undefined &&
        options.reasoningEffort !== "none")
        ? undefined
        : (options.temperature ?? 0.1);
    this.headers = options.headers;
    this.fetchImplementation = options.fetch ?? fetch;
  }

  async generate(
    request: DashboardAIProviderRequest,
  ): Promise<DashboardAIProviderResponse> {
    const structuredRequest =
      this.schemaMode === "json-envelope"
        ? providerJsonEnvelopeRequest(request)
        : { userPrompt: request.userPrompt, jsonSchema: request.jsonSchema };
    const headers = new Headers(this.headers);
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    if (this.apiKey) headers.set("Authorization", `Bearer ${this.apiKey}`);

    const response = await this.fetchImplementation(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: structuredRequest.userPrompt },
          ],
          temperature: this.temperature,
          reasoning_effort: this.reasoningEffort,
          stream: false,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "gridframe_dashboard_proposal",
              strict: true,
              schema: structuredRequest.jsonSchema,
            },
          },
        }),
      },
    );

    const body = await readProviderResponseBody(response);
    if (!response.ok) {
      throw new OpenAICompatibleProviderError(
        `OpenAI-compatible request failed with ${response.status}`,
      );
    }
    const providerContent = providerFirstChoiceContent(body);
    const content =
      providerContent === undefined
        ? undefined
        : this.schemaMode === "json-envelope"
          ? unwrapProviderJsonEnvelope(providerContent)
          : providerContent;
    if (content === undefined) {
      throw new OpenAICompatibleProviderError(
        "OpenAI-compatible endpoint returned an invalid response",
      );
    }

    return {
      content,
      model: providerString(body, "model") ?? this.model,
      inputTokens: providerNestedNumber(body, "usage", "prompt_tokens"),
      outputTokens: providerNestedNumber(body, "usage", "completion_tokens"),
    };
  }
}

class OpenAIDashboardAIProvider extends OpenAICompatibleDashboardAIProvider {
  constructor(options: OpenAIProviderOptions) {
    if (!options.apiKey.trim())
      throw new Error("An OpenAI API key is required");
    const model = options.model ?? DEFAULT_OPENAI_MODEL;
    const reasoningEffort =
      options.reasoningEffort ??
      (isOpenAIReasoningModel(model) ? "low" : undefined);
    super({
      ...options,
      baseUrl: options.baseUrl ?? DEFAULT_OPENAI_BASE_URL,
      model,
      schemaMode: "json-envelope",
      reasoningEffort,
      temperature:
        options.temperature !== undefined
          ? options.temperature
          : reasoningEffort !== undefined && reasoningEffort !== "none"
            ? null
            : 0.1,
    });
  }
}

function isOpenAIReasoningModel(model: string) {
  return /^(gpt-5|o[134](?:-|$))/.test(model);
}

export {
  DEFAULT_OPENAI_MODEL,
  OpenAIDashboardAIProvider,
  OpenAICompatibleDashboardAIProvider,
  OpenAICompatibleProviderError,
};
export type { OpenAICompatibleProviderOptions, OpenAIProviderOptions };
export type { OpenAIReasoningEffort };
