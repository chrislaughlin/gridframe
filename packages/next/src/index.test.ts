import { describe, expect, it, vi } from "vitest";
import { createNextGridframeRoute } from "./index";

describe("createNextGridframeRoute", () => {
  it("routes bootstrap with host-owned identity", async () => {
    const bootstrap = vi.fn(async () => Response.json({ ok: true }));
    const route = createNextGridframeRoute(
      { handlers: { bootstrap } } as never,
      { resolveIdentity: () => ({ userId: "user-1" }) },
    );
    const response = await route.POST(new Request("http://example.test", { method: "POST" }), { params: Promise.resolve({ gridframe: ["bootstrap"] }) });
    expect(response.status).toBe(200);
    expect(bootstrap).toHaveBeenCalledWith(expect.any(Request), { userId: "user-1" });
  });

  it("returns safe responses for unsupported routes and methods", async () => {
    const route = createNextGridframeRoute({ handlers: {} } as never, { resolveIdentity: () => ({ userId: "user-1" }) });
    expect((await route.GET(new Request("http://example.test"), { params: Promise.resolve({ gridframe: ["unknown"] }) })).status).toBe(404);
    expect((await route.POST(new Request("http://example.test", { method: "POST" }), { params: Promise.resolve({ gridframe: ["unknown"] }) })).status).toBe(405);
  });
});
