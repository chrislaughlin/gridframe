import { dashboardProposalJsonSchema } from "@gridframe/core";
import { describe, expect, it, vi } from "vitest";

import {
  AnthropicDashboardAIProvider,
  DEFAULT_ANTHROPIC_MODEL,
} from "./anthropic-provider";

describe("AnthropicDashboardAIProvider", () => {
  it("uses native Messages structured output and normalizes the response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        model: DEFAULT_ANTHROPIC_MODEL,
        content: [
          {
            type: "text",
            text: JSON.stringify({ proposal: '{"version":1}' }),
          },
        ],
        usage: { input_tokens: 18, output_tokens: 6 },
      }),
    );
    const provider = new AnthropicDashboardAIProvider({
      apiKey: "anthropic-secret",
      fetch: fetchMock,
    });

    await expect(
      provider.generate({
        systemPrompt: "system",
        userPrompt: "user",
        jsonSchema: dashboardProposalJsonSchema(),
      }),
    ).resolves.toEqual({
      content: '{"version":1}',
      model: DEFAULT_ANTHROPIC_MODEL,
      inputTokens: 18,
      outputTokens: 6,
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.anthropic.com/v1/messages",
    );
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("x-api-key")).toBe("anthropic-secret");
    expect(headers.get("anthropic-version")).toBe("2023-06-01");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      model: DEFAULT_ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: "system",
      messages: [
        {
          role: "user",
          content: expect.stringContaining("dashboardProposalSchema"),
        },
      ],
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            required: ["proposal"],
            additionalProperties: false,
          },
        },
      },
    });
    expect(body).not.toHaveProperty("temperature");
    expect(JSON.stringify(body.messages)).toContain("dashboardProposalSchema");
    expect(String(init.body)).not.toContain("anthropic-secret");
  });
});
