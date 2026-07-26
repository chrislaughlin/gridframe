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

const DEFAULT_GOOGLE_MODEL = "gemini-3.5-flash";
const DEFAULT_GOOGLE_BASE_URL = "https://generativelanguage.googleapis.com/v1";

type GoogleProviderOptions = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  headers?: HeadersInit;
  fetch?: typeof fetch;
};

class GoogleProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleProviderError";
  }
}

class GoogleDashboardAIProvider implements DashboardAIProvider {
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly headers?: HeadersInit;
  private readonly fetchImplementation: typeof fetch;

  constructor(options: GoogleProviderOptions) {
    if (!options.apiKey.trim()) {
      throw new Error("A Google AI API key is required");
    }
    const model = options.model ?? DEFAULT_GOOGLE_MODEL;
    const baseUrl = options.baseUrl ?? DEFAULT_GOOGLE_BASE_URL;
    if (!model.trim()) throw new Error("A Google AI model is required");
    if (!baseUrl.trim()) throw new Error("A Google AI base URL is required");
    this.apiKey = options.apiKey;
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
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
    headers.set("x-goog-api-key", this.apiKey);

    const response = await this.fetchImplementation(
      `${this.baseUrl}/interactions`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: this.model,
          input: structuredRequest.userPrompt,
          system_instruction: request.systemPrompt,
          store: false,
          stream: false,
          generation_config: {
            temperature: 0.1,
            thinking_level: "low",
          },
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: structuredRequest.jsonSchema,
          },
        }),
      },
    );

    const body = await readProviderResponseBody(response);
    if (!response.ok) {
      throw new GoogleProviderError(
        `Google AI request failed with ${response.status}`,
      );
    }
    const providerContent = firstModelText(body);
    const content =
      providerContent === undefined
        ? undefined
        : unwrapProviderJsonEnvelope(providerContent);
    if (content === undefined) {
      throw new GoogleProviderError("Google AI returned an invalid response");
    }

    return {
      content,
      model: providerString(body, "model") ?? this.model,
      inputTokens: providerNestedNumber(body, "usage", "total_input_tokens"),
      outputTokens: providerNestedNumber(body, "usage", "total_output_tokens"),
    };
  }
}

function firstModelText(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.steps)) return undefined;
  for (const step of value.steps) {
    if (!isRecord(step) || step.type !== "model_output") continue;
    if (!Array.isArray(step.content)) continue;
    const content = step.content.find(
      (item) => isRecord(item) && item.type === "text",
    );
    if (isRecord(content) && typeof content.text === "string") {
      return content.text;
    }
  }
  return undefined;
}

export { DEFAULT_GOOGLE_MODEL, GoogleDashboardAIProvider, GoogleProviderError };
export type { GoogleProviderOptions };
