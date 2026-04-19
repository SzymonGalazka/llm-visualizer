import type {
  AnalyzeRequest,
  AnalyzeResponse,
  FeatureDetail,
  StatusResponse,
} from "./types";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  status(): Promise<StatusResponse> {
    return request<StatusResponse>("/status");
  },

  analyze(body: AnalyzeRequest): Promise<AnalyzeResponse> {
    return request<AnalyzeResponse>("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  feature(layer: number, index: number): Promise<FeatureDetail> {
    return request<FeatureDetail>(`/feature/${layer}/${index}`);
  },
};
