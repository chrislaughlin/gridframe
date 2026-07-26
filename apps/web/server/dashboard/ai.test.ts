import { describe, expect, it } from "vitest";

import {
  authorizePublicDashboardExampleRequest,
  createDashboardAIProviderFromEnvironment,
} from "./ai";

describe("Dashboard AI example provider configuration", () => {
  it.each([
    ["openrouter", { OPENROUTER_API_KEY: "key" }, "openai/gpt-4o-mini"],
    ["openai", { OPENAI_API_KEY: "key" }, "gpt-4o-mini"],
    ["anthropic", { ANTHROPIC_API_KEY: "key" }, "claude-sonnet-5"],
    ["google", { GEMINI_API_KEY: "key" }, "gemini-3.5-flash"],
    [
      "openai-compatible",
      {
        GRIDFRAME_AI_BASE_URL: "http://localhost:11434/v1",
        GRIDFRAME_AI_MODEL: "local-model",
      },
      "local-model",
    ],
  ] as const)(
    "configures the %s provider from server environment",
    (provider, providerEnvironment, expectedModel) => {
      const configured = createDashboardAIProviderFromEnvironment({
        GRIDFRAME_AI_PROVIDER: provider,
        ...providerEnvironment,
      });

      expect(configured?.model).toBe(expectedModel);
    },
  );
});

describe("public Dashboard AI example authorization", () => {
  it("authorizes same-origin requests for the public example identity", () => {
    const authorization = authorizePublicDashboardExampleRequest(
      new Request("https://example.com/api/gridframe/ai", {
        method: "POST",
        headers: { Origin: "https://example.com" },
      }),
      "example-user",
    );

    expect(authorization).toEqual({ principalId: "example-user" });
  });

  it.each([
    ["a cross-origin request", "example-user", "https://other.example.com"],
    ["another route identity", "another-user", "https://example.com"],
  ])("rejects %s", (_scenario, userId, origin) => {
    const authorization = authorizePublicDashboardExampleRequest(
      new Request("https://example.com/api/gridframe/ai", {
        method: "POST",
        headers: { Origin: origin },
      }),
      userId,
    );

    expect(authorization).toBeInstanceOf(Response);
    expect((authorization as Response).status).toBe(403);
  });
});
