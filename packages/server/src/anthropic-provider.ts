import type {
  DashboardAIProvider,
  DashboardAIProviderRequest,
  DashboardAIProviderResponse,
} from "./ai-provider";
import {
  isRecord,
  providerJsonEnvelopeRequest,
  providerNestedNumber,
  providerString,
  readProviderResponseBody,
  unwrapProviderJsonEnvelope,
} from "./provider-http";

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";
const DEFAULT_ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
const DEFAULT_ANTHROPIC_VERSION = "2023-06-01";

type AnthropicProviderOptions = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  apiVersion?: string;
  maxTokens?: number;
  temperature?: number;
  headers?: HeadersInit;
  fetch?: typeof fetch;
};

class AnthropicProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnthropicProviderError";
  }
}

class AnthropicDashboardAIProvider implements DashboardAIProvider {
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly apiVersion: string;
  private readonly maxTokens: number;
  private readonly temperature?: number;
  private readonly headers?: HeadersInit;
  private readonly fetchImplementation: typeof fetch;

  constructor(options: AnthropicProviderOptions) {
    if (!options.apiKey.trim()) {
      throw new Error("An Anthropic API key is required");
    }
    if (
      options.maxTokens !== undefined &&
      (!Number.isSafeInteger(options.maxTokens) || options.maxTokens < 1)
    ) {
      throw new Error("Anthropic maxTokens must be positive");
    }
    if (
      options.temperature !== undefined &&
      (!Number.isFinite(options.temperature) ||
        options.temperature < 0 ||
        options.temperature > 1)
    ) {
      throw new Error("Anthropic temperature must be between 0 and 1");
    }
    const model = options.model ?? DEFAULT_ANTHROPIC_MODEL;
    const baseUrl = options.baseUrl ?? DEFAULT_ANTHROPIC_BASE_URL;
    const apiVersion = options.apiVersion ?? DEFAULT_ANTHROPIC_VERSION;
    if (!model.trim()) throw new Error("An Anthropic model is required");
    if (!baseUrl.trim()) throw new Error("An Anthropic base URL is required");
    if (!apiVersion.trim()) {
      throw new Error("An Anthropic API version is required");
    }
    this.apiKey = options.apiKey;
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiVersion = apiVersion;
    this.maxTokens = options.maxTokens ?? 4096;
    this.temperature =
      options.temperature ??
      (this.model === DEFAULT_ANTHROPIC_MODEL ? undefined : 0.1);
    this.headers = options.headers;
    this.fetchImplementation = options.fetch ?? fetch;
  }

  async generate(
    request: DashboardAIProviderRequest,
  ): Promise<DashboardAIProviderResponse> {
    const structuredRequest = providerJsonEnvelopeRequest(request);
    const headers = new Headers(this.headers);
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    headers.set("anthropic-version", this.apiVersion);
    headers.set("x-api-key", this.apiKey);

    const response = await this.fetchImplementation(
      `${this.baseUrl}/messages`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          system: request.systemPrompt,
          messages: [{ role: "user", content: structuredRequest.userPrompt }],
          temperature: this.temperature,
          output_config: {
            effort: "low",
            format: {
              type: "json_schema",
              schema: structuredRequest.jsonSchema,
            },
          },
        }),
      },
    );

    const body = await readProviderResponseBody(response);
    if (!response.ok) {
      throw new AnthropicProviderError(
        `Anthropic request failed with ${response.status}`,
      );
    }
    const providerContent = firstTextContent(body);
    const content =
      providerContent === undefined
        ? undefined
        : unwrapProviderJsonEnvelope(providerContent);
    if (content === undefined) {
      throw new AnthropicProviderError(
        "Anthropic returned an invalid response",
      );
    }

    return {
      content,
      model: providerString(body, "model") ?? this.model,
      inputTokens: providerNestedNumber(body, "usage", "input_tokens"),
      outputTokens: providerNestedNumber(body, "usage", "output_tokens"),
    };
  }
}

function firstTextContent(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.content)) return undefined;
  const content = value.content.find(
    (item) => isRecord(item) && item.type === "text",
  );
  return isRecord(content) && typeof content.text === "string"
    ? content.text
    : undefined;
}

export {
  AnthropicDashboardAIProvider,
  AnthropicProviderError,
  DEFAULT_ANTHROPIC_MODEL,
};
export type { AnthropicProviderOptions };
