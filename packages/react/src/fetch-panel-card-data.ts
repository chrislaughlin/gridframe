import {
  PanelCardDataResponseSchema,
  type PanelCardDataResponse,
} from "@gridframe/core";

async function fetchPanelCardData(
  query: string,
): Promise<PanelCardDataResponse> {
  const response = await fetch(query, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return {
      status: "error",
      message: `Request failed with ${response.status} ${response.statusText}`,
    };
  }

  return PanelCardDataResponseSchema.parse(await response.json());
}

export { fetchPanelCardData };
