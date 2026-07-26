import { dashboardProposalJsonSchema } from "@gridframe/core";
import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_OPENAI_MODEL,
  OpenAIDashboardAIProvider,
  OpenAICompatibleDashboardAIProvider,
} from "./openai-compatible-provider";

const request = {
  systemPrompt: "system",
  userPrompt: "user",
  jsonSchema: { type: "object", additionalProperties: false },
};

describe("OpenAI-compatible Dashboard AI providers", () => {
  it("calls a custom Chat Completions endpoint with strict structured output", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        model: "local/dashboard-model",
        choices: [{ message: { content: '{"version":1}' } }],
        usage: { prompt_tokens: 12, completion_tokens: 4 },
      }),
    );
    const provider = new OpenAICompatibleDashboardAIProvider({
      baseUrl: "https://models.example.test/v1/",
      model: "local/dashboard-model",
      apiKey: "custom-secret",
      schemaMode: "direct",
      headers: { "X-Workspace": "analytics" },
      fetch: fetchMock,
    });

    await expect(provider.generate(request)).resolves.toEqual({
      content: '{"version":1}',
      model: "local/dashboard-model",
      inputTokens: 12,
      outputTokens: 4,
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://models.example.test/v1/chat/completions",
    );
    const headers = new Headers(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).headers,
    );
    expect(headers.get("authorization")).toBe("Bearer custom-secret");
    expect(headers.get("x-workspace")).toBe("analytics");
    const body = requestBody(fetchMock);
    expect(body).toMatchObject({
      model: "local/dashboard-model",
      messages: [
        { role: "system", content: "system" },
        { role: "user", content: "user" },
      ],
      temperature: 0.1,
      stream: false,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "gridframe_dashboard_proposal",
          strict: true,
          schema: request.jsonSchema,
        },
      },
    });
    expect(JSON.stringify(body)).not.toContain("custom-secret");
  });

  it("configures the first-party OpenAI endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({ proposal: '{"version":1}' }),
            },
          },
        ],
      }),
    );
    const provider = new OpenAIDashboardAIProvider({
      apiKey: "openai-secret",
      fetch: fetchMock,
    });

    await expect(
      provider.generate({
        ...request,
        jsonSchema: dashboardProposalJsonSchema(),
      }),
    ).resolves.toMatchObject({
      content: '{"version":1}',
      model: DEFAULT_OPENAI_MODEL,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.any(Object),
    );
    const body = requestBody(fetchMock);
    expect(body).toMatchObject({
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          strict: true,
          schema: {
            type: "object",
            required: ["proposal"],
            additionalProperties: false,
          },
        },
      },
    });
    expect(JSON.stringify(body.messages)).toContain("dashboardProposalSchema");
    expect(JSON.stringify(body.messages)).toContain("missingInformation");
  });

  it("uses low effort without temperature for OpenAI reasoning models", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({ proposal: '{"version":1}' }),
            },
          },
        ],
      }),
    );
    const provider = new OpenAIDashboardAIProvider({
      apiKey: "openai-secret",
      model: "gpt-5.6-terra",
      fetch: fetchMock,
    });

    await provider.generate(request);

    const body = requestBody(fetchMock);
    expect(body.reasoning_effort).toBe("low");
    expect(body).not.toHaveProperty("temperature");
  });
});

function requestBody(fetchMock: ReturnType<typeof vi.fn>) {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
  return JSON.parse(String(init.body)) as Record<string, unknown>;
}
