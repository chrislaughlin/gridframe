# Agent Factory project contract

## Repository
- Forge: github
- Remote: chrislaughlin/gridframe
- Default branch: main
- Branch prefix: codex/

## Instructions and architecture
- Agent instructions: AGENTS.md
- Architecture sources: CONTEXT.md, docs/adr/, README.md, apps/web/README.md, apps/docs/README.md, packages/react/README.md, packages/server/README.md, docs/ai-dashboards.md
- Coding standards: AGENTS.md, CONTEXT.md, docs/agents/domain.md, package ESLint configurations, packages/eslint-config/, packages/typescript-config/
- Additional required context: docs/agents/issue-tracker.md, docs/agents/triage-labels.md, and the relevant area-specific README and ADRs

## Environment
- Setup command: pnpm install
- Required services: Neon Postgres for the web app; a separate Neon branch or database for database integration tests
- Required environment variables: DATABASE_URL; TEST_DATABASE_URL for database integration tests; GRIDFRAME_AI_PROVIDER and its matching OPENROUTER_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or GRIDFRAME_AI_API_KEY for AI runtime QA
- Development command: pnpm dev

## Verification commands
- Focused tests: pnpm --filter WORKSPACE test -- TEST_FILE
- Full tests: pnpm test
- Lint: pnpm lint
- Typecheck: pnpm check-types
- Build: pnpm build
- Security/dependency check: pnpm audit --audit-level high

## QA
- Launch instructions: Provide DATABASE_URL through the harness or the ignored repository-root .env.development.local file, run `pnpm dev`, open http://localhost:3000 for the example app and http://localhost:3001 for the docs app, and exercise the changed Dashboard, API, or documentation surface. For AI behavior, also provide the selected provider configuration through the harness.
- Runtime surfaces: browser | api | library
- Fixtures or test data: Use the built-in `example-user` Dashboard and deterministic faker-backed consumer API. Use a dedicated Neon branch or database for mutable QA and TEST_DATABASE_URL for database integration tests; never use production or personal data.
- Required evidence: Record the relevant passing command output and observable runtime proof. For browser changes, capture screenshots of the affected states and viewport sizes; for API changes, capture sanitized request/response status and bodies; for library behavior, provide focused test output and, when rendering is affected, browser evidence from the example app.

## Change publication
- PR/MR title convention: Imperative sentence case, for example `Add reusable dashboard theming` or `Fix AI dashboard workflow`
- PR/MR template: none
- Required local checks: pnpm test, pnpm lint, pnpm check-types, pnpm build, pnpm audit --audit-level high
- Required CI checks: none

## Monitoring
- Poll interval seconds: 60
- Timeout minutes: 60

## Human boundary
Agent Factory may create and update a ready-for-review PR/MR. It must never merge or deploy.
