import type { NextTokenPrediction } from "../types";
import { formatToken } from "../utils/token";

interface Props {
  predictions: NextTokenPrediction[];
  text: string;
}

export function PredictionsBar({ predictions, text }: Props) {
  if (!predictions.length) return null;

  const maxProb = predictions[0].prob;

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        background: "#111827",
        border: "1px solid #374151",
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 320,
        maxWidth: 520,
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
        }}
      >
        Next token after &ldquo;{text}&rdquo;
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {predictions.slice(0, 5).map((p, i) => (
          <div
            key={p.vocab_idx}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              minWidth: 54,
            }}
          >
            <span
              style={{
                background: i === 0 ? "#2d1b4e" : "#1f2937",
                border: `1px solid ${i === 0 ? "#7c3aed" : "#374151"}`,
                borderRadius: 6,
                padding: "4px 10px",
                color: i === 0 ? "#e9d5ff" : "#d1d5db",
                fontSize: 13,
                fontFamily: "monospace",
                fontWeight: i === 0 ? 700 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {formatToken(p.token) || "·"}
            </span>
            {/* probability bar */}
            <div
              style={{
                width: "100%",
                height: 3,
                background: "#1f2937",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(p.prob / maxProb) * 100}%`,
                  height: "100%",
                  background: i === 0 ? "#7c3aed" : "#4b5563",
                  borderRadius: 2,
                }}
              />
            </div>
            <span style={{ color: "#6b7280", fontSize: 10 }}>
              {(p.prob * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
