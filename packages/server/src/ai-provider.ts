type DashboardAIProviderRequest = {
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: Record<string, unknown>;
};

type DashboardAIProviderResponse = {
  content: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
};

interface DashboardAIProvider {
  readonly model: string;
  generate(
    request: DashboardAIProviderRequest,
  ): Promise<DashboardAIProviderResponse>;
}

export type {
  DashboardAIProvider,
  DashboardAIProviderRequest,
  DashboardAIProviderResponse,
};
