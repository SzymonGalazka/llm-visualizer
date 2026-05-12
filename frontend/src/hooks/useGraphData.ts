import { useState, useCallback, useEffect } from "react";
import { api } from "../api";
import type {
  AnalyzeRequest,
  NextTokenPrediction,
  RawNode,
  RawEdge,
  StatusResponse,
} from "../types";

interface GraphDataState {
  nodes: RawNode[];
  edges: RawEdge[];
  predictions: NextTokenPrediction[];
  loading: boolean;
  error: string | null;
  status: StatusResponse | null;
}

export function useGraphData() {
  const [state, setState] = useState<GraphDataState>({
    nodes: [],
    edges: [],
    predictions: [],
    loading: false,
    error: null,
    status: null,
  });

  // Incrementing this key restarts the polling effect (e.g. after a model switch).
  const [pollKey, setPollKey] = useState(0);

  // Poll status until model is loaded
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const s = await api.status();
        if (cancelled) return;
        setState((prev) => ({ ...prev, status: s }));
        if (!s.loaded) {
          setTimeout(poll, 3000);
        }
      } catch {
        if (!cancelled) setTimeout(poll, 5000);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [pollKey]);

  const switchModel = useCallback(async (model: string) => {
    setState((prev) => ({
      ...prev,
      nodes: [],
      edges: [],
      predictions: [],
      error: null,
    }));
    await api.switchModel(model);
    // Restart polling — the new model will be loaded: false until ready.
    setPollKey((k) => k + 1);
  }, []);

  const analyze = useCallback(
    async (params: {
      text: string;
      layer: number;
      topKFeatures: number;
      topKConcepts: number;
      threshold: number;
    }) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const req: AnalyzeRequest = {
        text: params.text,
        layer: params.layer,
        top_k_features: params.topKFeatures,
        top_k_concepts: params.topKConcepts,
        threshold: params.threshold,
      };

      try {
        const result = await api.analyze(req);
        setState((prev) => ({
          ...prev,
          nodes: result.nodes,
          edges: result.edges,
          predictions: result.next_token_predictions ?? [],
          loading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        }));
      }
    },
    [],
  );

  return { ...state, analyze, switchModel };
}
