# Gridframe web example

This Next.js application demonstrates the complete API-managed Gridframe flow:

- lazy creation of a fake user's default Dashboard in SQLite;
- persisted Card layouts and names with revision conflict handling;
- trusted Card library add/remove across every Visualization;
- owner-scoped, server-mediated consumer Queries;
- generated Card Deeplinks with Visualization and source records.

Run `pnpm dev` at the repository root and open [http://localhost:3000](http://localhost:3000). The home route redirects to `/gridframe/users/example-user/dashboards`.

Data is stored in `.data/gridframe.sqlite` by default. Set `GRIDFRAME_DATABASE_PATH` to choose another file and `GRIDFRAME_CONSUMER_API_BASE_URL` to configure the trusted consumer API base.
