import type {
  DashboardAIProvider,
  DashboardAIProviderRequest,
  DashboardAIProviderResponse,
} from "./ai-provider";
import {
  providerFirstChoiceContent,
  providerNestedNumber,
  providerString,
  readProviderResponseBody,
} from "./provider-http";

const DEFAULT_OPENROUTER_MODEL = "openai/gpt-oss-20b";
const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

type OpenRouterProviderOptions = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  appName?: string;
  appUrl?: string;
  fetch?: typeof fetch;
};

class OpenRouterProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterProviderError";
  }
}

class OpenRouterDashboardAIProvider implements DashboardAIProvider {
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly appName?: string;
  private readonly appUrl?: string;
  private readonly fetchImplementation: typeof fetch;

  constructor(options: OpenRouterProviderOptions) {
    if (!options.apiKey.trim()) {
      throw new Error("An OpenRouter API key is required");
    }
    const model = options.model ?? DEFAULT_OPENROUTER_MODEL;
    const baseUrl = options.baseUrl ?? DEFAULT_OPENROUTER_BASE_URL;
    if (!model.trim()) throw new Error("An OpenRouter model is required");
    if (!baseUrl.trim()) {
      throw new Error("An OpenRouter base URL is required");
    }
    this.apiKey = options.apiKey;
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.appName = options.appName;
    this.appUrl = options.appUrl;
    this.fetchImplementation = options.fetch ?? fetch;
  }

  async generate(
    request: DashboardAIProviderRequest,
  ): Promise<DashboardAIProviderResponse> {
    const response = await this.fetchImplementation(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...(this.appName ? { "X-Title": this.appName } : {}),
          ...(this.appUrl ? { "HTTP-Referer": this.appUrl } : {}),
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt },
          ],
          temperature: 0.1,
          reasoning: { effort: "low" },
          provider: { require_parameters: true },
          stream: false,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "gridframe_dashboard_proposal",
              strict: true,
              schema: request.jsonSchema,
            },
          },
        }),
      },
    );

    const body = await readProviderResponseBody(response);
    if (!response.ok) {
      throw new OpenRouterProviderError(
        `OpenRouter request failed with ${response.status}`,
      );
    }
    const content = providerFirstChoiceContent(body);
    if (content === undefined) {
      throw new OpenRouterProviderError(
        "OpenRouter returned an invalid response",
      );
    }

    return {
      content,
      model: providerString(body, "model") ?? this.model,
      inputTokens: providerNestedNumber(body, "usage", "prompt_tokens"),
      outputTokens: providerNestedNumber(body, "usage", "completion_tokens"),
      cost: providerNestedNumber(body, "usage", "cost"),
    };
  }
}

export {
  DEFAULT_OPENROUTER_MODEL,
  OpenRouterDashboardAIProvider,
  OpenRouterProviderError,
};
export type { OpenRouterProviderOptions };
