import { type PanelCardDataResponse } from "./types";

async function fetchPanelCardData(query: string): Promise<PanelCardDataResponse> {
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

  return (await response.json()) as PanelCardDataResponse;
}

export { fetchPanelCardData };
