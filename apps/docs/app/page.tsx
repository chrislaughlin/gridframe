const githubRoot = "https://github.com/chrislaughlin/gridframe";

const providers = [
  "OpenRouter",
  "OpenAI",
  "Anthropic",
  "Google",
  "OpenAI-compatible",
] as const;

const capabilities = [
  {
    number: "01",
    title: "Describe the outcome",
    description:
      "Ask for a new Dashboard or changes to the current one in natural language. Prompt examples in the dialog help users get started.",
  },
  {
    number: "02",
    title: "Plan with approved parts",
    description:
      "The model can only select AI-enabled Cards and semantic fields that your server exposes for the current user.",
  },
  {
    number: "03",
    title: "Repair, then inspect",
    description:
      "Gridframe makes one constrained repair attempt when structured output is invalid, then shows every action, assumption, issue, and resolved Card layout.",
  },
  {
    number: "04",
    title: "Apply deliberately",
    description:
      "Generation is read-only. Apply validates again, then asks your Dashboard repository to persist the result in one transaction.",
  },
] as const;

const actions = [
  "Create a named Dashboard",
  "Update Dashboard metadata",
  "Add, update, or remove Cards",
  "Move and resize Cards",
  "Add or remove global filters",
] as const;

const routes = [
  {
    method: "POST",
    path: "/users/:userId/ai/dashboard-proposals",
    purpose: "Generate and validate a preview",
  },
  {
    method: "POST",
    path: "/users/:userId/ai/dashboard-proposals/validate",
    purpose: "Validate an existing proposal",
  },
  {
    method: "POST",
    path: "/users/:userId/ai/dashboard-proposals/apply",
    purpose: "Revalidate and write transactionally",
  },
] as const;

const serviceCode = `const provider = createDashboardAIProvider({
  provider: "anthropic",
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const service = createDashboardAIService({
  repository,
  provider,
  aiCardLibrary: cards.aiCardLibrary,
  cardLibrary: cards.cardLibrary,
  dataCatalogue: fields,
  permissions: permissionsForUser,
  authorize: authorizeDashboardAI,
});

export const aiHandlers =
  createDashboardAIHandlers({ service });`;

const cardCode = `const cards = defineCards({
  "total-revenue": {
    name: "Total revenue",
    description: "Recognised order revenue.",
    visualization: "metric",
    defaultLayout: { width: 1, height: 2 },
    ai: {
      tags: ["sales", "revenue", "kpi"],
      questionsAnswered: ["What is total revenue?"],
      requiredDataShape: {
        minMetrics: 1,
        maxMetrics: 1,
      },
    },
    resolve: resolveRevenue,
  },
});`;

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
    >
      <path
        d="M3.5 8h9m-3.5-3.5L12.5 8 9 11.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 18 18"
      width="18"
    >
      <path
        d="m4 9 3.1 3.1L14 5.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="siteShell">
      <header className="siteHeader">
        <a className="wordmark" href="#top">
          <span className="mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Gridframe
          <span className="docsLabel">Docs</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#overview">AI overview</a>
          <a href="#quickstart">Quickstart</a>
          <a href="#security">Security</a>
          <a
            className="githubLink"
            href={githubRoot}
            rel="noreferrer"
            target="_blank"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="heroCopy">
            <p className="eyebrow">
              <span className="statusDot" />
              Dashboard AI · available now
            </p>
            <h1>
              Describe the Dashboard.
              <span>Keep control of the data.</span>
            </h1>
            <p className="heroLead">
              Turn natural-language requests into validated Dashboard proposals
              built only from your registered Cards and approved fields. Preview
              every change. Apply when it is right.
            </p>
            <div className="heroActions">
              <a className="primaryButton" href="#quickstart">
                Configure Dashboard AI <ArrowIcon />
              </a>
              <a
                className="textLink"
                href={`${githubRoot}/blob/main/docs/ai-dashboards.md`}
                rel="noreferrer"
                target="_blank"
              >
                Read the full guide
              </a>
            </div>
            <div className="providerStrip" aria-label="Supported AI providers">
              <span>Works with</span>
              {providers.map((provider) => (
                <b key={provider}>{provider}</b>
              ))}
            </div>
          </div>

          <div className="proposalWindow" aria-label="Example AI proposal">
            <div className="windowBar">
              <div>
                <span />
                <span />
                <span />
              </div>
              <p>Dashboard proposal</p>
              <em>Preview</em>
            </div>
            <div className="prompt">
              <span>You</span>
              <p>
                Add revenue and order KPIs above a 12-month revenue trend.
                Include a region filter.
              </p>
            </div>
            <div className="proposalBody">
              <div className="proposalHeading">
                <div>
                  <span className="tinyLabel">Proposed result</span>
                  <h2>Revenue pulse</h2>
                </div>
                <span className="readyBadge">
                  <i /> Ready to apply
                </span>
              </div>
              <div className="miniGrid">
                <article className="metricCard">
                  <span>Total revenue</span>
                  <strong>£284k</strong>
                  <small>SUM · 12 months</small>
                </article>
                <article className="metricCard">
                  <span>Total orders</span>
                  <strong>4,821</strong>
                  <small>COUNT · 12 months</small>
                </article>
                <article className="chartCard">
                  <span>Revenue trend</span>
                  <div className="chart" aria-hidden="true">
                    {[38, 50, 42, 68, 58, 74, 62, 86, 78, 95, 82, 100].map(
                      (height, index) => (
                        <i key={index} style={{ height: `${height}%` }} />
                      ),
                    )}
                  </div>
                </article>
              </div>
              <div className="proposalFooter">
                <span>4 actions · 0 validation errors</span>
                <span className="mockApply">Apply proposal</span>
              </div>
            </div>
          </div>
        </section>

        <section className="flowSection" id="overview">
          <div className="sectionIntro">
            <p className="eyebrow">The guarded generation loop</p>
            <h2>AI plans. Gridframe decides what is valid.</h2>
            <p>
              The provider never receives an open-ended path into your
              application. Gridframe constructs a constrained planning catalogue
              and owns the proposal contract from generation through
              persistence.
            </p>
          </div>
          <div className="capabilityGrid">
            {capabilities.map((capability) => (
              <article key={capability.number}>
                <span>{capability.number}</span>
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="contractSection">
          <div className="contractCopy">
            <p className="eyebrow">A proposal, not executable code</p>
            <h2>A small contract with firm boundaries.</h2>
            <p>
              Models return versioned JSON actions. They cannot send SQL,
              JavaScript, React components, or arbitrary database commands. Card
              data continues through the Card data resolvers you already trust.
            </p>
            <ul>
              {actions.map((action) => (
                <li key={action}>
                  <CheckIcon />
                  {action}
                </li>
              ))}
            </ul>
          </div>
          <div className="contractVisual">
            <div className="railLabel">
              <span>Model output</span>
              <span>Gridframe boundary</span>
              <span>Your application</span>
            </div>
            <div className="contractRail">
              <div className="railNode">
                <b>Proposal JSON</b>
                <small>Versioned actions</small>
              </div>
              <i className="railArrow">→</i>
              <div className="railNode validationNode">
                <b>Repair + validate</b>
                <small>One repair · two checks</small>
              </div>
              <i className="railArrow">→</i>
              <div className="railNode">
                <b>Dashboard repository</b>
                <small>Must write transactionally</small>
              </div>
            </div>
            <div className="boundaryNotes">
              <span>Card allowlist</span>
              <span>Safe field catalogue</span>
              <span>Permission grants</span>
              <span>Revision check</span>
            </div>
          </div>
        </section>

        <section className="quickstartSection" id="quickstart">
          <div className="sectionIntro">
            <p className="eyebrow">Quickstart</p>
            <h2>Bring your provider. Keep your architecture.</h2>
            <p>
              Add AI metadata to existing Card definitions, expose semantic
              fields, then mount three Fetch-native handlers. The same service
              works with Next.js, Express, Hono, and other Fetch-compatible
              runtimes.
            </p>
          </div>
          <div className="codeTabs">
            <article className="codePanel">
              <div className="codeHeader">
                <span>1</span>
                <div>
                  <b>Enable trusted Cards</b>
                  <small>cards.ts</small>
                </div>
              </div>
              <pre>
                <code>{cardCode}</code>
              </pre>
            </article>
            <article className="codePanel codePanelAccent">
              <div className="codeHeader">
                <span>2</span>
                <div>
                  <b>Configure the service</b>
                  <small>dashboard-ai.ts</small>
                </div>
              </div>
              <pre>
                <code>{serviceCode}</code>
              </pre>
            </article>
          </div>
          <div className="routeTable">
            <div className="routeTableHeader">
              <span>Method</span>
              <span>Route</span>
              <span>Purpose</span>
            </div>
            {routes.map((route) => (
              <div className="routeRow" key={route.path}>
                <strong>{route.method}</strong>
                <code>{route.path}</code>
                <span>{route.purpose}</span>
              </div>
            ))}
          </div>
          <a
            className="guideLink"
            href={`${githubRoot}/blob/main/docs/ai-dashboards.md`}
            rel="noreferrer"
            target="_blank"
          >
            Continue with provider configuration, safe fields, and route
            adapters <ArrowIcon />
          </a>
        </section>

        <section className="securitySection" id="security">
          <div className="securityTitle">
            <p className="eyebrow">Security model</p>
            <h2>The useful kind of boring.</h2>
            <p>
              Explicit capabilities, server-held credentials, repeatable
              validation, and transactional writes. No secret autonomy hiding
              behind the sparkle button.
            </p>
          </div>
          <div className="securityList">
            <article>
              <span>AUTH</span>
              <div>
                <h3>Bind identity on the server</h3>
                <p>
                  Derive <code>principalId</code> from the authenticated
                  session. Never trust the route user ID by itself.
                </p>
              </div>
            </article>
            <article>
              <span>DATA</span>
              <div>
                <h3>Expose semantic fields only</h3>
                <p>
                  Sensitive fields are removed before prompt construction. Card
                  data resolvers remain the only path to Card data.
                </p>
              </div>
            </article>
            <article>
              <span>WRITE</span>
              <div>
                <h3>Require an explicit Apply</h3>
                <p>
                  Apply repeats permission, schema, field, layout, and revision
                  checks, then calls your Dashboard repository. Its create and
                  update operations must write transactionally.
                </p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer>
        <div>
          <span className="wordmark">
            <span className="mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            Gridframe
          </span>
          <p>Dashboard infrastructure for product teams.</p>
        </div>
        <div className="footerLinks">
          <a href={`${githubRoot}/blob/main/README.md`}>Documentation</a>
          <a href={`${githubRoot}/tree/main/apps/web`}>Example app</a>
          <a href="https://www.npmjs.com/package/@gridframe/react">npm</a>
          <a href={githubRoot}>GitHub</a>
        </div>
      </footer>
    </div>
  );
}
