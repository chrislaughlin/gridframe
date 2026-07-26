// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardAIDialog } from "./dashboard-ai-dialog";

const dashboard = {
  id: "dashboard-1",
  revision: "1",
  config: {
    title: "Existing dashboard",
    cards: [
      {
        id: "existing-card",
        name: "Recent orders",
        visualization: "table" as const,
        query: "/cards/existing-card/data",
        layout: { x: 0, y: 4, width: 4, height: 4 },
      },
    ],
  },
};

const proposalResponse = {
  proposal: {
    version: 1 as const,
    title: "Sales overview",
    intent: { objective: "Track revenue" },
    actions: [
      {
        type: "addCard" as const,
        card: {
          cardKey: "total-revenue",
          title: "Total revenue",
          data: {
            metrics: [{ field: "revenue", aggregation: "sum" as const }],
          },
          layout: { x: 0, y: 0, width: 1, height: 2 },
        },
      },
      { type: "moveCard" as const, cardId: "existing-card", x: 0, y: 2 },
    ],
    assumptions: ["Revenue uses the account currency."],
    missingInformation: [],
    explanation: "Revenue appears before order detail.",
  },
  validation: { valid: true, canApply: true, errors: [], warnings: [] },
  preview: {
    title: "Sales overview",
    cards: [
      {
        cardKey: "total-revenue",
        title: "Total revenue",
        layout: { x: 0, y: 0, width: 1, height: 2 },
        changes: ["added" as const],
      },
      {
        id: "existing-card",
        title: "Recent orders",
        layout: { x: 0, y: 2, width: 4, height: 4 },
        changes: ["moved" as const],
      },
    ],
  },
  dashboardId: "dashboard-1",
  revision: "1",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderDialog(onDashboardChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <DashboardAIDialog
        dashboard={dashboard}
        disabled={false}
        onDashboardChange={onDashboardChange}
        userId="user-1"
      />
    </QueryClientProvider>,
  );
  return onDashboardChange;
}

describe("DashboardAIDialog", () => {
  it("previews changes and applies only after explicit confirmation", async () => {
    const appliedDashboard = {
      ...dashboard,
      revision: "2",
      config: { ...dashboard.config, title: "Sales overview" },
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
      String(input).endsWith("/apply")
        ? new Response(JSON.stringify(appliedDashboard))
        : new Response(JSON.stringify(proposalResponse)),
    );
    vi.stubGlobal("fetch", fetchMock);
    const onDashboardChange = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Create with AI" }));
    fireEvent.change(screen.getByLabelText("Describe your dashboard changes"), {
      target: { value: "Add a revenue KPI" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate preview" }));

    expect(await screen.findByText("Sales overview")).toBeInTheDocument();
    expect(screen.getByText("Add Total revenue")).toBeInTheDocument();
    expect(screen.getByText("Move Recent orders")).toBeInTheDocument();
    expect(screen.getByText("moved")).toBeInTheDocument();
    expect(
      screen.getByText("Revenue uses the account currency."),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const previewBody = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1]?.body),
    );
    expect(previewBody).toMatchObject({
      dashboardId: "dashboard-1",
      revision: "1",
      prompt: "Add a revenue KPI",
    });
    expect(onDashboardChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Apply proposal" }));
    await waitFor(() =>
      expect(onDashboardChange).toHaveBeenCalledWith(appliedDashboard),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("creates a new Dashboard without persisting during generation", async () => {
    const creationResponse = {
      ...proposalResponse,
      proposal: {
        ...proposalResponse.proposal,
        actions: [
          {
            type: "createDashboard" as const,
            title: "New sales Dashboard",
          },
          proposalResponse.proposal.actions[0]!,
        ],
      },
      preview: {
        title: "New sales Dashboard",
        cards: [proposalResponse.preview.cards[0]!],
      },
      dashboardId: undefined,
      revision: undefined,
    };
    const createdDashboard = {
      ...dashboard,
      id: "dashboard-2",
      config: { ...dashboard.config, title: "New sales Dashboard" },
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
      String(input).endsWith("/apply")
        ? new Response(JSON.stringify(createdDashboard))
        : new Response(JSON.stringify(creationResponse)),
    );
    vi.stubGlobal("fetch", fetchMock);
    const onDashboardChange = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Create with AI" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Create new Dashboard" }),
    );
    fireEvent.change(screen.getByLabelText("Describe your dashboard changes"), {
      target: { value: "Create a new sales Dashboard" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate preview" }));

    expect(
      await screen.findByText("Set Dashboard title to New sales Dashboard"),
    ).toBeInTheDocument();
    const firstBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(firstBody).not.toHaveProperty("dashboardId");
    expect(firstBody).not.toHaveProperty("revision");
    expect(onDashboardChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Apply proposal" }));
    await waitFor(() =>
      expect(onDashboardChange).toHaveBeenCalledWith(createdDashboard),
    );
    const applyBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(applyBody).not.toHaveProperty("dashboardId");
    expect(applyBody).not.toHaveProperty("revision");
  });

  it("shows missing information and disables Apply", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              ...proposalResponse,
              proposal: {
                ...proposalResponse.proposal,
                missingInformation: ["Choose a reporting currency."],
              },
              validation: {
                valid: true,
                canApply: false,
                errors: [],
                warnings: [
                  {
                    code: "MISSING_INFORMATION",
                    message: "Choose a reporting currency.",
                    path: ["missingInformation", 0],
                  },
                ],
              },
            }),
          ),
      ),
    );
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Create with AI" }));
    fireEvent.change(screen.getByLabelText("Describe your dashboard changes"), {
      target: { value: "Create a dashboard" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate preview" }));

    expect(
      await screen.findByText("Choose a reporting currency."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Apply proposal" }),
    ).toBeDisabled();
  });
});
