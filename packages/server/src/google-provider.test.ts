import { dashboardProposalJsonSchema } from "@gridframe/core";
import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_GOOGLE_MODEL,
  GoogleDashboardAIProvider,
} from "./google-provider";

describe("GoogleDashboardAIProvider", () => {
  it("uses stateless Interactions structured output and normalizes the response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        model: DEFAULT_GOOGLE_MODEL,
        status: "completed",
        steps: [
          {
            type: "model_output",
            content: [
              {
                type: "text",
                text: JSON.stringify({ proposal: '{"version":1}' }),
              },
            ],
          },
        ],
        usage: { total_input_tokens: 21, total_output_tokens: 7 },
      }),
    );
    const provider = new GoogleDashboardAIProvider({
      apiKey: "google-secret",
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
      model: DEFAULT_GOOGLE_MODEL,
      inputTokens: 21,
      outputTokens: 7,
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://generativelanguage.googleapis.com/v1/interactions",
    );
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("x-goog-api-key")).toBe("google-secret");
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: DEFAULT_GOOGLE_MODEL,
      input: expect.stringContaining("dashboardProposalSchema"),
      system_instruction: "system",
      store: false,
      stream: false,
      generation_config: {
        temperature: 0.1,
        thinking_level: "low",
      },
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: {
          type: "object",
          required: ["proposal"],
          additionalProperties: false,
        },
      },
    });
    expect(String(init.body)).not.toContain("google-secret");
  });
});
