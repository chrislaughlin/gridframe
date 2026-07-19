import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_OPENROUTER_MODEL,
  OpenRouterDashboardAIProvider,
} from "./openrouter-provider";

describe("OpenRouterDashboardAIProvider", () => {
  it("uses server authorization and strict structured output", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          model: DEFAULT_OPENROUTER_MODEL,
          choices: [{ message: { content: '{"version":1}' } }],
          usage: { prompt_tokens: 100, completion_tokens: 20, cost: 0.002 },
        }),
      ),
    );
    const provider = new OpenRouterDashboardAIProvider({
      apiKey: "server-secret",
      fetch: fetchMock,
    });

    await expect(
      provider.generate({
        systemPrompt: "system",
        userPrompt: "user",
        jsonSchema: { type: "object" },
      }),
    ).resolves.toEqual({
      content: '{"version":1}',
      model: DEFAULT_OPENROUTER_MODEL,
      inputTokens: 100,
      outputTokens: 20,
      cost: 0.002,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer server-secret",
        }),
      }),
    );
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));
    expect(body).toMatchObject({
      model: DEFAULT_OPENROUTER_MODEL,
      temperature: 0.1,
      reasoning: { effort: "low" },
      provider: { require_parameters: true },
      stream: false,
      response_format: {
        type: "json_schema",
        json_schema: { strict: true },
      },
    });
    expect(JSON.stringify(body)).not.toContain("server-secret");
  });
});
