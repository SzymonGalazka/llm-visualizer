import { useState, type FormEvent } from "react";
import { Search, Layers, SlidersHorizontal } from "lucide-react";

interface Props {
  onAnalyze: (params: {
    text: string;
    layer: number;
    topKFeatures: number;
    topKConcepts: number;
    threshold: number;
  }) => void;
  loading: boolean;
  availableLayers: number[];
}

export function ControlPanel({ onAnalyze, loading, availableLayers }: Props) {
  const [text, setText] = useState("Ala ma kota");
  const [layer, setLayer] = useState(availableLayers[0] ?? 9);
  const [topKFeatures, setTopKFeatures] = useState(5);
  const [topKConcepts, setTopKConcepts] = useState(3);
  const [threshold, setThreshold] = useState(0.0);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onAnalyze({
      text: text.trim(),
      layer,
      topKFeatures,
      topKConcepts,
      threshold,
    });
  }

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: "#111827",
        borderRight: "1px solid #1f2937",
        display: "flex",
        flexDirection: "column",
        padding: 16,
        gap: 20,
        overflowY: "auto",
      }}
    >
      <h2
        style={{
          color: "#f9fafb",
          fontWeight: 700,
          fontSize: 14,
          margin: 0,
          letterSpacing: 0.5,
        }}
      >
        LLM Visualizer
      </h2>
      <p style={{ color: "#6b7280", fontSize: 11, margin: 0 }}>
        Gemma 2 9B IT · Gemma Scope SAEs
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        {/* Input phrase */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelStyle}>
            <Search size={12} /> Input phrase
          </label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Ala ma kota"
            style={inputStyle}
          />
        </div>

        {/* Layer selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelStyle}>
            <Layers size={12} /> SAE Layer
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            {availableLayers.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayer(l)}
                style={{
                  flex: 1,
                  padding: "5px 4px",
                  borderRadius: 6,
                  border: `1px solid ${layer === l ? "#7c3aed" : "#374151"}`,
                  background: layer === l ? "#2d1b4e" : "#1f2937",
                  color: layer === l ? "#c084fc" : "#9ca3af",
                  fontSize: 12,
                  fontWeight: layer === l ? 700 : 400,
                  cursor: "pointer",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={labelStyle}>
            <SlidersHorizontal size={12} /> Controls
          </label>

          <SliderField
            label={`Top features / token: ${topKFeatures}`}
            min={1}
            max={20}
            value={topKFeatures}
            onChange={setTopKFeatures}
          />
          <SliderField
            label={`Top concepts / feature: ${topKConcepts}`}
            min={1}
            max={10}
            value={topKConcepts}
            onChange={setTopKConcepts}
          />
          <SliderField
            label={`Activation threshold: ${threshold.toFixed(1)}`}
            min={0}
            max={10}
            step={0.5}
            value={threshold}
            onChange={setThreshold}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !text.trim()}
          style={{
            padding: "9px 0",
            borderRadius: 8,
            border: "none",
            background: loading ? "#374151" : "#7c3aed",
            color: loading ? "#6b7280" : "#fff",
            fontWeight: 600,
            fontSize: 13,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </form>
    </aside>
  );
}

function SliderField({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ color: "#9ca3af", fontSize: 11 }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: "#7c3aed", width: "100%" }}
      />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: 11,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  display: "flex",
  alignItems: "center",
  gap: 5,
};

const inputStyle: React.CSSProperties = {
  background: "#1f2937",
  border: "1px solid #374151",
  borderRadius: 6,
  color: "#f9fafb",
  padding: "7px 10px",
  fontSize: 13,
  outline: "none",
  width: "100%",
};
