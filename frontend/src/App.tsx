import { useState, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { ControlPanel } from "./components/ControlPanel";
import { GraphView } from "./components/GraphView";
import { NodeInspector } from "./components/NodeInspector";
import { PredictionsBar } from "./components/PredictionsBar";
import { useGraphData } from "./hooks/useGraphData";
import type { AppNodeData } from "./types";

export default function App() {
  const { nodes, edges, predictions, loading, error, status, analyze } =
    useGraphData();
  const [selectedNode, setSelectedNode] = useState<AppNodeData | null>(null);
  const [analyzedText, setAnalyzedText] = useState("");

  const handleAnalyze = useCallback(
    (params: {
      text: string;
      layer: number;
      topKFeatures: number;
      topKConcepts: number;
      threshold: number;
    }) => {
      setSelectedNode(null);
      setAnalyzedText(params.text);
      analyze(params);
    },
    [analyze],
  );

  const availableLayers = status?.available_layers ?? [9, 20, 31];
  const modelReady = status?.loaded ?? false;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <ControlPanel
        onAnalyze={handleAnalyze}
        loading={loading}
        availableLayers={availableLayers}
      />

      <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {predictions.length > 0 && !loading && (
          <PredictionsBar predictions={predictions} text={analyzedText} />
        )}

        {!modelReady && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 8,
              padding: "8px 16px",
              color: "#9ca3af",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#f59e0b",
                display: "inline-block",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
            Loading model — this may take a few minutes on first run
          </div>
        )}

        {error && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              background: "#450a0a",
              border: "1px solid #7f1d1d",
              borderRadius: 8,
              padding: "8px 16px",
              color: "#fca5a5",
              fontSize: 12,
              maxWidth: 420,
            }}
          >
            {error}
          </div>
        )}

        {nodes.length === 0 && !loading && !error && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#374151",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 48 }}>⟁</div>
            <div style={{ fontSize: 14 }}>
              {modelReady
                ? "Enter a phrase and click Analyze"
                : "Waiting for model to load…"}
            </div>
          </div>
        )}

        <ReactFlowProvider>
          <GraphView
            rawNodes={nodes}
            rawEdges={edges}
            onNodeClick={setSelectedNode}
          />
        </ReactFlowProvider>
      </main>

      <NodeInspector
        nodeData={selectedNode}
        onClose={() => setSelectedNode(null)}
      />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
