# Coordinated production API

Gridframe distinguishes inline, remote client-managed, and API-managed Card data. Inline responses use the same runtime schema as remote responses but never invoke fetch. API-managed source-data requests explicitly tell resolvers when normalized source records are required and propagate request cancellation.

`createGridframe` is the high-level server boundary and keeps a `defineCards` registry with its resolver. Framework-specific routing belongs in public adapters such as `@gridframe/next`; Fetch-native handlers remain the lower-level portable API. UI primitives remain private workspace implementation details and are bundled into `@gridframe/react`, never required from consumers.

Layout policy is represented by `GridframeLayoutConfig`, with current four-column responsive defaults. Published React CSS is compiled and scoped to a Gridframe root; Tailwind is an internal build tool.
