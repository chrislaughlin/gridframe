import type {
  AICardDefinition,
  AIDataField,
  CardDeeplinkConfig,
  DashboardCardDataConfig,
  DashboardCardLayout,
  DashboardGlobalFilter,
  DashboardProposal,
  DashboardProposalPreview,
  DashboardProposalValidationResult,
  VisualizationType,
} from "@gridframe/core";

import type {
  CardLibraryTemplate,
  DashboardRepository,
  MaybePromise,
  PersistedDashboard,
} from "./index";

type DashboardAIContext = {
  userId: string;
  dashboard?: PersistedDashboard;
  aiCardLibrary: readonly AICardDefinition[];
  cardLibrary: readonly CardLibraryTemplate[];
  dataCatalogue: readonly AIDataField[];
  permissions: readonly string[];
  dataSourceId?: string;
};

type DashboardProposalApplyCard = {
  id?: string;
  libraryItemKey?: string;
  name: string;
  description?: string;
  visualization: VisualizationType;
  data?: DashboardCardDataConfig;
  sourceQuery?: string;
  deeplink?: Omit<CardDeeplinkConfig, "href">;
  layout: DashboardCardLayout;
};

type DashboardProposalApplyUpdate = {
  title: string;
  description?: string;
  globalFilters: DashboardGlobalFilter[];
  cards: DashboardProposalApplyCard[];
};

interface DashboardAIRepository extends DashboardRepository {
  createDashboardFromProposal(
    ownerUserId: string,
    update: DashboardProposalApplyUpdate,
  ): MaybePromise<PersistedDashboard>;
  applyDashboardProposal(
    ownerUserId: string,
    dashboardId: string,
    revision: number,
    update: DashboardProposalApplyUpdate,
  ): MaybePromise<PersistedDashboard>;
}

type DashboardProposalPlan = {
  proposal: DashboardProposal;
  validation: DashboardProposalValidationResult;
  preview: DashboardProposalPreview;
  update?: DashboardProposalApplyUpdate;
};

type DashboardAIAuthorizationOperation = "propose" | "validate" | "apply";

type DashboardAIRequestContext = {
  userId: string;
  principalId: string;
  dashboardId?: string;
  revision?: string | number;
  dataSourceId?: string;
};

type DashboardAITelemetryEvent =
  | {
      type: "proposal.generation";
      model: string;
      success: boolean;
      durationMs: number;
      inputTokens?: number;
      outputTokens?: number;
      cost?: number;
    }
  | {
      type: "proposal.validation_failed";
      errorCount: number;
      unknownCardCount: number;
      unknownFieldCount: number;
    }
  | { type: "proposal.repair"; model: string; reasonCount: number }
  | {
      type: "proposal.application";
      dashboardId: string;
      success: boolean;
      actionCount: number;
    };

type DashboardAITelemetry = (
  event: DashboardAITelemetryEvent,
) => MaybePromise<void>;

export type {
  DashboardAIContext,
  DashboardAIRepository,
  DashboardAIAuthorizationOperation,
  DashboardAIRequestContext,
  DashboardAITelemetry,
  DashboardAITelemetryEvent,
  DashboardProposalApplyCard,
  DashboardProposalApplyUpdate,
  DashboardProposalPlan,
};
