import {
  PanelCardDataResponseSchema,
  type PanelCardDataResponse,
} from "@gridframe/core";

async function fetchPanelCardData(
  query: string,
  init?: RequestInit,
): Promise<PanelCardDataResponse> {
  const response = await fetch(query, {
    ...init,
    headers: new Headers({
      Accept: "application/json",
      ...Object.fromEntries(new Headers(init?.headers)),
    }),
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
