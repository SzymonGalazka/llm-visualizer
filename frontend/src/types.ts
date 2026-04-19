// ── Graph node/edge types (aligned with React Flow) ─────────────────────────

export type NodeKind = "token" | "feature" | "concept";

export interface TokenNodeData extends Record<string, unknown> {
  nodeType: "token";
  label: string;
  pos: number;
}

export interface FeatureNodeData extends Record<string, unknown> {
  nodeType: "feature";
  feat_idx: number;
  layer: number;
  layer_key: string;
  activation: number;
  description: string | null;
}

export interface ConceptNodeData extends Record<string, unknown> {
  nodeType: "concept";
  label: string;
  vocab_idx: number;
  score: number;
}

export type AppNodeData = TokenNodeData | FeatureNodeData | ConceptNodeData;

export interface EdgeData extends Record<string, unknown> {
  weight: number;
}

// ── API types ────────────────────────────────────────────────────────────────

export interface AnalyzeRequest {
  text: string;
  layer: number;
  top_k_features: number;
  top_k_concepts: number;
  threshold: number;
}

export interface RawNode {
  id: string;
  type: NodeKind;
  data: AppNodeData;
  position: { x: number; y: number };
}

export interface RawEdge {
  id: string;
  source: string;
  target: string;
  data: EdgeData;
  type: string;
}

export interface AnalyzeResponse {
  nodes: RawNode[];
  edges: RawEdge[];
  text: string;
  layer: number;
  next_token_predictions: NextTokenPrediction[];
}

export interface NextTokenPrediction {
  token: string;
  prob: number;
  vocab_idx: number;
}

export interface StatusResponse {
  loaded: boolean;
  model: string;
  available_layers: number[];
}

export interface FeatureDetail {
  feat_idx: number;
  layer: number;
  layer_key: string;
  description: string | null;
  autoInterp_score: number | null;
  pos_str: string[];
  neg_str: string[];
  activations: Array<{ tokens: string[]; values: number[] }>;
  neuronpedia_url: string;
}
