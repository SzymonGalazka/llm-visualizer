import { useEffect, useRef, useState } from "react";
import { ExternalLink, X, Zap, TrendingDown, Info } from "lucide-react";
import { api } from "../api";
import type { AppNodeData, FeatureDetail, FeatureNodeData } from "../types";

interface Props {
  nodeData: AppNodeData | null;
  onClose: () => void;
}

export function NodeInspector({ nodeData, onClose }: Props) {
  const [detail, setDetail] = useState<FeatureDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!nodeData || nodeData.nodeType !== "feature") {
      setDetail(null);
      return;
    }
    const fd = nodeData as FeatureNodeData;
    setLoading(true);
    api
      .feature(fd.layer, fd.feat_idx)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [nodeData]);

  if (!nodeData) return null;

  return (
    <aside
      style={{
        width: 280,
        minWidth: 280,
        background: "#111827",
        borderLeft: "1px solid #1f2937",
        display: "flex",
        flexDirection: "column",
        padding: 16,
        gap: 14,
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <NodeTypePill kind={nodeData.nodeType} />
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Token node */}
      {nodeData.nodeType === "token" && (
        <div>
          <div style={{ color: "#bfdbfe", fontSize: 22, fontWeight: 700 }}>
            {nodeData.label}
          </div>
          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
            Position {nodeData.pos}
          </div>
        </div>
      )}

      {/* Concept node */}
      {nodeData.nodeType === "concept" && (
        <div>
          <div style={{ color: "#bbf7d0", fontSize: 22, fontWeight: 700 }}>
            {nodeData.label}
          </div>
          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
            Vocab index {nodeData.vocab_idx}
          </div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>
            Logit score: {nodeData.score.toFixed(2)}
          </div>
        </div>
      )}

      {/* Feature node */}
      {nodeData.nodeType === "feature" && (
        <>
          <div>
            <div style={{ color: "#e9d5ff", fontSize: 13, fontWeight: 600 }}>
              {loading
                ? "Loading…"
                : (detail?.description ?? `Feature #${nodeData.feat_idx}`)}
            </div>
            <div style={{ color: "#6b7280", fontSize: 11, marginTop: 4 }}>
              Layer {nodeData.layer} · Index {nodeData.feat_idx}
            </div>
            <div style={{ color: "#6b7280", fontSize: 11 }}>
              Activation: {nodeData.activation.toFixed(3)}
            </div>
            {detail?.autoInterp_score != null && (
              <div style={{ color: "#6b7280", fontSize: 11 }}>
                AutoInterp score: {detail.autoInterp_score.toFixed(2)}
              </div>
            )}
          </div>

          {!loading && detail && (
            <>
              {detail.pos_str.length > 0 && (
                <TokenExamples
                  label="Activating tokens"
                  tooltip="Tokens whose presence causes this feature to fire strongly. Computed via the logit lens: projecting the feature's decoder direction through the model's unembedding matrix W_U."
                  tokens={detail.pos_str}
                  color="#86efac"
                  icon={<Zap size={11} />}
                />
              )}
              {detail.neg_str.length > 0 && (
                <TokenExamples
                  label="Suppressing tokens"
                  tooltip="Tokens that push this feature's activation down — the semantic opposite of what the feature detects. Also from the logit lens, but on the negative end."
                  tokens={detail.neg_str}
                  color="#fca5a5"
                  icon={<TrendingDown size={11} />}
                />
              )}

              {detail.activations.slice(0, 2).map((act, i) => (
                <div key={i}>
                  <div
                    style={{ color: "#6b7280", fontSize: 11, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}
                  >
                    Example {i + 1}
                    <InfoTooltip text="A real sentence from the training corpus where this feature had a high activation. Token brightness indicates activation strength." />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {act.tokens.map((tok, j) => (
                      <span
                        key={j}
                        style={{
                          background:
                            act.values[j] > 0
                              ? `rgba(124,58,237,${Math.min(act.values[j] / 10, 0.9)})`
                              : "#1f2937",
                          color: "#e9d5ff",
                          borderRadius: 4,
                          padding: "2px 5px",
                          fontSize: 11,
                          fontFamily: "monospace",
                        }}
                      >
                        {tok}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <a
                href={detail.neuronpedia_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  color: "#c084fc",
                  fontSize: 12,
                  textDecoration: "none",
                  borderTop: "1px solid #1f2937",
                  paddingTop: 10,
                  marginTop: 4,
                }}
              >
                <ExternalLink size={12} />
                View on Neuronpedia
              </a>
            </>
          )}
        </>
      )}
    </aside>
  );
}

function NodeTypePill({ kind }: { kind: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    token: { bg: "#1e3a5f", text: "#93c5fd" },
    feature: { bg: "#2d1b4e", text: "#c084fc" },
    concept: { bg: "#14532d", text: "#86efac" },
  };
  const c = colors[kind] ?? colors.token;
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        borderRadius: 4,
        padding: "2px 8px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: "uppercase",
      }}
    >
      {kind}
    </span>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span
      ref={ref}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "default" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <Info size={11} color="#4b5563" />
      {visible && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: 6,
            padding: "6px 10px",
            color: "#d1d5db",
            fontSize: 11,
            lineHeight: 1.5,
            width: 220,
            whiteSpace: "normal",
            zIndex: 50,
            pointerEvents: "none",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function TokenExamples({
  label,
  tooltip,
  tokens,
  color,
  icon,
}: {
  label: string;
  tooltip: string;
  tokens: string[];
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          color: "#6b7280",
          fontSize: 11,
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 5,
        }}
      >
        {icon} {label} <InfoTooltip text={tooltip} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {tokens.slice(0, 12).map((t, i) => (
          <span
            key={i}
            style={{
              background: "#1f2937",
              color,
              borderRadius: 4,
              padding: "2px 6px",
              fontSize: 11,
              fontFamily: "monospace",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
