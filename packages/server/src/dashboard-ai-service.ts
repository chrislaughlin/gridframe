import {
  DashboardProposalSchema,
  dashboardProposalJsonSchema,
  type AICardDefinition,
  type AIDataField,
  type CreateDashboardProposalResponse,
  type DashboardProposal,
  type DashboardProposalValidationIssue,
  type DashboardProposalValidationResult,
} from "@gridframe/core";

import type { DashboardAIProvider } from "./ai-provider";
import {
  DASHBOARD_AI_SYSTEM_PROMPT,
  buildDashboardProposalPrompt,
  buildDashboardProposalRepairPrompt,
} from "./dashboard-ai-prompt";
import type {
  DashboardAIContext,
  DashboardAIAuthorizationOperation,
  DashboardAIRepository,
  DashboardAIRequestContext,
  DashboardAITelemetry,
} from "./dashboard-ai-types";
import { validateDashboardProposal } from "./dashboard-proposal-validation";
import type {
  CardLibraryTemplate,
  MaybePromise,
  PersistedDashboard,
} from "./index";

type Resolvable<T> =
  | readonly T[]
  | ((context: DashboardAIRequestContext) => MaybePromise<readonly T[]>);

type DashboardAIServiceOptions = {
  repository: DashboardAIRepository;
  provider: DashboardAIProvider;
  aiCardLibrary: Resolvable<AICardDefinition>;
  cardLibrary: Resolvable<CardLibraryTemplate>;
  dataCatalogue: Resolvable<AIDataField>;
  permissions: Resolvable<string>;
  authorize: (
    context: DashboardAIRequestContext,
    operation: DashboardAIAuthorizationOperation,
  ) => MaybePromise<boolean>;
  telemetry?: DashboardAITelemetry;
};

class DashboardAIError extends Error {
  constructor(
    readonly code:
      | "AI_PERMISSION_DENIED"
      | "AI_PROPOSAL_INVALID"
      | "AI_PROPOSAL_NOT_APPLICABLE"
      | "REVISION_CONFLICT",
    message: string,
  ) {
    super(message);
    this.name = "DashboardAIError";
  }
}

function createDashboardAIService(options: DashboardAIServiceOptions) {
  async function authorize(
    context: DashboardAIRequestContext,
    operation: DashboardAIAuthorizationOperation,
  ) {
    if (!(await options.authorize(context, operation))) {
      throw new DashboardAIError(
        "AI_PERMISSION_DENIED",
        "You do not have permission to use Dashboard AI",
      );
    }
  }

  async function loadContext(context: DashboardAIRequestContext) {
    const [unfilteredCards, cardLibrary, dataCatalogue, permissions] =
      await Promise.all([
        resolve(options.aiCardLibrary, context),
        resolve(options.cardLibrary, context),
        resolve(options.dataCatalogue, context),
        resolve(options.permissions, context),
      ]);
    const grantedPermissions = new Set(permissions);
    const aiCardLibrary = unfilteredCards.filter((card) =>
      (card.requiredPermissions ?? []).every((permission) =>
        grantedPermissions.has(permission),
      ),
    );
    const authorizedCardKeys = new Set(aiCardLibrary.map((card) => card.key));
    const dashboard = context.dashboardId
      ? await options.repository.loadDashboard(
          context.userId,
          context.dashboardId,
        )
      : undefined;
    assertRevision(context.revision, dashboard);
    return {
      userId: context.userId,
      dashboard,
      aiCardLibrary,
      cardLibrary: cardLibrary.filter((card) =>
        authorizedCardKeys.has(card.key),
      ),
      dataCatalogue: dataCatalogue.filter((field) => !field.sensitive),
      permissions,
      dataSourceId: context.dataSourceId,
    };
  }

  return {
    async proposeDashboard(
      input: DashboardAIRequestContext & { prompt: string },
    ): Promise<CreateDashboardProposalResponse> {
      await authorize(input, "propose");
      const context = await loadContext(input);
      const userPrompt = buildDashboardProposalPrompt({
        prompt: input.prompt,
        aiCardLibrary: context.aiCardLibrary,
        dataCatalogue: context.dataCatalogue,
        dashboard: context.dashboard,
        dataSourceId: input.dataSourceId,
      });
      const first = await generate(options, userPrompt);
      let parsed = parseProposal(first.content, context);

      if (shouldRepair(parsed)) {
        await emitValidation(options.telemetry, parsed.validation);
        await emit(options.telemetry, {
          type: "proposal.repair",
          model: options.provider.model,
          reasonCount: parsed.validation.errors.length,
        });
        const repairPrompt = buildDashboardProposalRepairPrompt({
          originalPrompt: userPrompt,
          invalidResponse: first.content,
          errors: parsed.validation.errors,
        });
        const repaired = await generate(options, repairPrompt);
        parsed = parseProposal(repaired.content, context);
        if (shouldRepair(parsed)) {
          await emitValidation(options.telemetry, parsed.validation);
          throw new DashboardAIError(
            "AI_PROPOSAL_INVALID",
            "The model did not return a valid Dashboard proposal",
          );
        }
      }

      if (!parsed.proposal) {
        throw new DashboardAIError(
          "AI_PROPOSAL_INVALID",
          "The model did not return a valid Dashboard proposal",
        );
      }
      await emitValidation(options.telemetry, parsed.validation);
      return {
        proposal: parsed.proposal,
        validation: parsed.validation,
        preview: parsed.preview,
        dashboardId: context.dashboard?.id,
        revision: context.dashboard
          ? String(context.dashboard.revision)
          : undefined,
      };
    },

    async validateProposal(
      input: DashboardAIRequestContext & { proposal: DashboardProposal },
    ) {
      await authorize(input, "validate");
      const context = await loadContext(input);
      const result = validateDashboardProposal(input.proposal, context);
      await emitValidation(options.telemetry, result.validation);
      return result.validation;
    },

    async applyProposal(
      input: DashboardAIRequestContext & { proposal: DashboardProposal },
    ) {
      await authorize(input, "apply");
      try {
        const context = await loadContext(input);
        const result = validateDashboardProposal(input.proposal, context);
        if (!result.validation.canApply || !result.update) {
          await emitValidation(options.telemetry, result.validation);
          throw new DashboardAIError(
            "AI_PROPOSAL_NOT_APPLICABLE",
            "The Dashboard proposal cannot be applied",
          );
        }

        const dashboard = context.dashboard
          ? await options.repository.applyDashboardProposal(
              input.userId,
              context.dashboard.id,
              context.dashboard.revision,
              result.update,
            )
          : await options.repository.createDashboardFromProposal(
              input.userId,
              result.update,
            );
        await emit(options.telemetry, {
          type: "proposal.application",
          dashboardId: dashboard.id,
          success: true,
          actionCount: input.proposal.actions.length,
        });
        return dashboard;
      } catch (error) {
        await emit(options.telemetry, {
          type: "proposal.application",
          dashboardId: input.dashboardId ?? "new-dashboard",
          success: false,
          actionCount: input.proposal.actions.length,
        });
        throw error;
      }
    },
  };
}

type DashboardAIService = ReturnType<typeof createDashboardAIService>;

async function generate(
  options: DashboardAIServiceOptions,
  userPrompt: string,
) {
  const startedAt = Date.now();
  try {
    const response = await options.provider.generate({
      systemPrompt: DASHBOARD_AI_SYSTEM_PROMPT,
      userPrompt,
      jsonSchema: dashboardProposalJsonSchema(),
    });
    await emit(options.telemetry, {
      type: "proposal.generation",
      model: response.model,
      success: true,
      durationMs: Date.now() - startedAt,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      cost: response.cost,
    });
    return response;
  } catch (error) {
    await emit(options.telemetry, {
      type: "proposal.generation",
      model: options.provider.model,
      success: false,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}

function parseProposal(content: string, context: DashboardAIContext) {
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    const issue: DashboardProposalValidationIssue = {
      code: "INVALID_JSON",
      message: "The model response is not valid JSON",
      path: [],
    };
    return {
      proposal: undefined,
      validation: {
        valid: false,
        canApply: false,
        errors: [issue],
        warnings: [],
      },
      preview: { title: "Invalid proposal", cards: [] },
    };
  }
  const schema = DashboardProposalSchema.safeParse(json);
  const result = validateDashboardProposal(json, context);
  return {
    proposal: schema.success ? schema.data : undefined,
    validation: result.validation,
    preview: result.preview,
  };
}

function shouldRepair(result: {
  proposal?: DashboardProposal;
  validation: DashboardProposalValidationResult;
}) {
  if (!result.proposal) return true;
  return !result.validation.valid;
}

function assertRevision(
  expected: string | number | undefined,
  dashboard: PersistedDashboard | undefined,
) {
  if (expected === undefined) return;
  if (!dashboard) {
    throw new DashboardAIError(
      "REVISION_CONFLICT",
      "Dashboard was changed by another request",
    );
  }
  if (String(expected) !== String(dashboard.revision)) {
    throw new DashboardAIError(
      "REVISION_CONFLICT",
      "Dashboard was changed by another request",
    );
  }
}

async function resolve<T>(
  value: Resolvable<T>,
  context: DashboardAIRequestContext,
) {
  return typeof value === "function" ? value(context) : value;
}

async function emit(
  telemetry: DashboardAITelemetry | undefined,
  event: Parameters<DashboardAITelemetry>[0],
) {
  try {
    await telemetry?.(event);
  } catch {
    // Telemetry must not change proposal or persistence behaviour.
  }
}

async function emitValidation(
  telemetry: DashboardAITelemetry | undefined,
  validation: DashboardProposalValidationResult,
) {
  if (validation.valid) return;
  await emit(telemetry, {
    type: "proposal.validation_failed",
    errorCount: validation.errors.length,
    unknownCardCount: validation.errors.filter(
      (error) => error.code === "UNKNOWN_CARD_KEY",
    ).length,
    unknownFieldCount: validation.errors.filter(
      (error) => error.code === "UNKNOWN_FIELD",
    ).length,
  });
}

export { DashboardAIError, createDashboardAIService };
export type { DashboardAIService, DashboardAIServiceOptions };
