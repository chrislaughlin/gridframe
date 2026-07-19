import type {
  DashboardAIProvider,
  DashboardAIProviderRequest,
  DashboardAIProviderResponse,
} from "./ai-provider";

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
    this.apiKey = options.apiKey;
    this.model = options.model ?? DEFAULT_OPENROUTER_MODEL;
    this.baseUrl = (options.baseUrl ?? DEFAULT_OPENROUTER_BASE_URL).replace(
      /\/+$/,
      "",
    );
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

    const body = await readResponseBody(response);
    if (!response.ok) {
      throw new OpenRouterProviderError(
        `OpenRouter request failed with ${response.status}`,
      );
    }
    const content = firstChoiceContent(body);
    if (content === undefined) {
      throw new OpenRouterProviderError(
        "OpenRouter returned an invalid response",
      );
    }

    return {
      content,
      model: stringProperty(body, "model") ?? this.model,
      inputTokens: nestedNumber(body, "usage", "prompt_tokens"),
      outputTokens: nestedNumber(body, "usage", "completion_tokens"),
      cost: nestedNumber(body, "usage", "cost"),
    };
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function firstChoiceContent(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.choices)) return undefined;
  const choice = value.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) return undefined;
  return typeof choice.message.content === "string"
    ? choice.message.content
    : undefined;
}

function stringProperty(value: unknown, key: string) {
  return isRecord(value) && typeof value[key] === "string"
    ? value[key]
    : undefined;
}

function nestedNumber(value: unknown, parent: string, key: string) {
  if (!isRecord(value) || !isRecord(value[parent])) return undefined;
  const nested = value[parent][key];
  return typeof nested === "number" ? nested : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export {
  DEFAULT_OPENROUTER_MODEL,
  OpenRouterDashboardAIProvider,
  OpenRouterProviderError,
};
export type { OpenRouterProviderOptions };
