import { describe, expect, it } from "vitest";

import {
  AnthropicDashboardAIProvider,
  GoogleDashboardAIProvider,
  OpenAIDashboardAIProvider,
  OpenAICompatibleDashboardAIProvider,
  OpenRouterDashboardAIProvider,
  createDashboardAIProvider,
} from ".";

describe("createDashboardAIProvider", () => {
  it("constructs every supported provider from one discriminated config", () => {
    expect(
      createDashboardAIProvider({ provider: "openrouter", apiKey: "key" }),
    ).toBeInstanceOf(OpenRouterDashboardAIProvider);
    expect(
      createDashboardAIProvider({ provider: "openai", apiKey: "key" }),
    ).toBeInstanceOf(OpenAIDashboardAIProvider);
    expect(
      createDashboardAIProvider({ provider: "anthropic", apiKey: "key" }),
    ).toBeInstanceOf(AnthropicDashboardAIProvider);
    expect(
      createDashboardAIProvider({ provider: "google", apiKey: "key" }),
    ).toBeInstanceOf(GoogleDashboardAIProvider);
    expect(
      createDashboardAIProvider({
        provider: "openai-compatible",
        baseUrl: "http://localhost:11434/v1",
        model: "local-model",
      }),
    ).toBeInstanceOf(OpenAICompatibleDashboardAIProvider);
  });
});
