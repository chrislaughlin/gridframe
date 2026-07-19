import { afterEach, describe, expect, it, vi } from "vitest";

import {
  authenticateDashboardAIRequest,
  createDashboardAISession,
  createDashboardAIProviderFromEnvironment,
  handleDashboardAIRequest,
} from "./ai";

const originalUserId = process.env.GRIDFRAME_AI_USER_ID;
const originalAccessToken = process.env.GRIDFRAME_AI_ACCESS_TOKEN;

afterEach(() => {
  vi.useRealTimers();
  restoreEnvironment("GRIDFRAME_AI_USER_ID", originalUserId);
  restoreEnvironment("GRIDFRAME_AI_ACCESS_TOKEN", originalAccessToken);
});

describe("Dashboard AI example authentication", () => {
  it.each([
    ["openrouter", { OPENROUTER_API_KEY: "key" }, "openai/gpt-oss-20b"],
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

  it("fails closed before provider or repository initialization", async () => {
    delete process.env.GRIDFRAME_AI_USER_ID;
    delete process.env.GRIDFRAME_AI_ACCESS_TOKEN;

    const response = await handleDashboardAIRequest(
      new Request("http://localhost/ai", { method: "POST" }),
      "user-1",
      "proposeDashboard",
    );

    expect(response.status).toBe(503);
  });

  it("rejects an invalid token and a mismatched route identity", async () => {
    process.env.GRIDFRAME_AI_USER_ID = "user-1";
    process.env.GRIDFRAME_AI_ACCESS_TOKEN = "server-only-token";

    const invalidToken = await handleDashboardAIRequest(
      new Request("http://localhost/ai", {
        method: "POST",
        headers: { Authorization: "Bearer wrong-token" },
      }),
      "user-1",
      "proposeDashboard",
    );
    const wrongUser = await handleDashboardAIRequest(
      new Request("http://localhost/ai", {
        method: "POST",
        headers: { Authorization: "Bearer server-only-token" },
      }),
      "user-2",
      "proposeDashboard",
    );

    expect(invalidToken.status).toBe(403);
    expect(wrongUser.status).toBe(403);
  });

  it("authorizes related Dashboard mutations with the same principal", () => {
    process.env.GRIDFRAME_AI_USER_ID = "user-1";
    process.env.GRIDFRAME_AI_ACCESS_TOKEN = "server-only-token";

    const authentication = authenticateDashboardAIRequest(
      new Request("http://localhost/global-filter", {
        method: "PATCH",
        headers: { Authorization: "Bearer server-only-token" },
      }),
      "user-1",
    );

    expect(authentication).toEqual({ principalId: "user-1" });
  });

  it("exchanges the example credential for an HttpOnly signed session", () => {
    process.env.GRIDFRAME_AI_USER_ID = "user-1";
    process.env.GRIDFRAME_AI_ACCESS_TOKEN = "server-only-token";

    const response = createDashboardAISession(
      new Request("http://localhost/api/gridframe/ai/session", {
        method: "POST",
        headers: { Origin: "http://localhost" },
      }),
      { userId: "user-1", accessToken: "server-only-token" },
    );

    expect(response.status).toBe(204);
    const cookie = response.headers.get("set-cookie");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).not.toContain("server-only-token");
  });

  it("rejects a signed session after its server-enforced expiry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-19T12:00:00Z"));
    process.env.GRIDFRAME_AI_USER_ID = "user-1";
    process.env.GRIDFRAME_AI_ACCESS_TOKEN = "server-only-token";

    const sessionResponse = createDashboardAISession(
      new Request("http://localhost/api/gridframe/ai/session", {
        method: "POST",
        headers: { Origin: "http://localhost" },
      }),
      { userId: "user-1", accessToken: "server-only-token" },
    );
    const cookie = sessionResponse.headers.get("set-cookie")?.split(";", 1)[0];
    vi.setSystemTime(new Date("2026-07-19T20:00:01Z"));

    const response = await handleDashboardAIRequest(
      new Request("http://localhost/api/gridframe/users/user-1/ai", {
        method: "POST",
        headers: { Cookie: cookie ?? "", Origin: "http://localhost" },
      }),
      "user-1",
      "proposeDashboard",
    );

    expect(response.status).toBe(403);
  });
});

function restoreEnvironment(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}
