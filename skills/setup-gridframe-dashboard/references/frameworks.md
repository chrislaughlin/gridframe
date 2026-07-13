# Framework Mounting

Gridframe handlers consume Web `Request` objects and return Web `Response` objects. Keep them framework-neutral; isolate translation in route modules.

## Native Fetch frameworks

For Hono, TanStack Start, and other Fetch-native servers, pass the raw request and route parameters to the selected handler and return its `Response`. Resolve authentication before the call.

## Next.js App Router

Create route handlers for every path in `contracts.md`. Await dynamic `params`, authenticate, verify the URL `userId`, and call the singleton handler factory. Import Gridframe CSS once in the application layout.

Use the Node runtime when the selected database driver requires it. Do not force Edge runtime compatibility onto a Node-only persistence stack.

## Express-style servers

Convert the incoming request into a Web `Request`, including URL, method, relevant headers, abort signal, and JSON body. Convert the returned Web `Response` status, headers, and body back to the framework response. Do not assume every Gridframe response is JSON when writing a generic bridge.

## Unknown frameworks

Inspect installed version-matched framework docs and existing routes. Implement the smallest adapter that preserves HTTP method, URL, headers, body, cancellation, and response headers. Add an adapter-level test before declaring support.
