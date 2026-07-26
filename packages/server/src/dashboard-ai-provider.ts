import {
  AnthropicDashboardAIProvider,
  type AnthropicProviderOptions,
} from "./anthropic-provider";
import {
  GoogleDashboardAIProvider,
  type GoogleProviderOptions,
} from "./google-provider";
import {
  OpenAIDashboardAIProvider,
  OpenAICompatibleDashboardAIProvider,
  type OpenAICompatibleProviderOptions,
  type OpenAIProviderOptions,
} from "./openai-compatible-provider";
import {
  OpenRouterDashboardAIProvider,
  type OpenRouterProviderOptions,
} from "./openrouter-provider";

type DashboardAIProviderName =
  | "openrouter"
  | "openai"
  | "anthropic"
  | "google"
  | "openai-compatible";

type DashboardAIProviderConfig =
  | ({ provider: "openrouter" } & OpenRouterProviderOptions)
  | ({ provider: "openai" } & OpenAIProviderOptions)
  | ({ provider: "anthropic" } & AnthropicProviderOptions)
  | ({ provider: "google" } & GoogleProviderOptions)
  | ({ provider: "openai-compatible" } & OpenAICompatibleProviderOptions);

function createDashboardAIProvider(config: DashboardAIProviderConfig) {
  switch (config.provider) {
    case "openrouter":
      return new OpenRouterDashboardAIProvider(config);
    case "openai":
      return new OpenAIDashboardAIProvider(config);
    case "anthropic":
      return new AnthropicDashboardAIProvider(config);
    case "google":
      return new GoogleDashboardAIProvider(config);
    case "openai-compatible":
      return new OpenAICompatibleDashboardAIProvider(config);
  }
}

export { createDashboardAIProvider };
export type { DashboardAIProviderConfig, DashboardAIProviderName };
