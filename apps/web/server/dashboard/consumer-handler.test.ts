import { describe, expect, it } from "vitest";

import { createConsumerCardHandler } from "./consumer-handler";

describe("faker consumer HTTP handler", () => {
  it("returns deterministic records for the same source key", async () => {
    const handler = createConsumerCardHandler();

    const first = await handler("recent-orders");
    const second = await handler("recent-orders");

    expect(first.status).toBe(200);
    expect(await first.json()).toEqual(await second.json());
  });

  it("returns 404 for an unknown source key", async () => {
    const response = await createConsumerCardHandler()("unknown");

    expect(response.status).toBe(404);
  });
});
