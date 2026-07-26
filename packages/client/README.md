# @gridframe/client

Typed, response-validating HTTP client for Gridframe.

```ts
import { createGridframeClient } from "@gridframe/client";

const client = createGridframeClient({
  baseUrl: "/api/gridframe",
  headers: async () => ({ Authorization: `Bearer ${await token()}` }),
  credentials: "include",
  fetch: globalThis.fetch,
});
```

Transport options apply to Dashboard, Card library, Card data and optional AI operations. The original standalone functions remain available.
