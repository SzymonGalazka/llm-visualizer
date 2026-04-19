import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ConceptNodeData } from "../../types";

export const ConceptNode = memo(function ConceptNode({
  data,
  selected,
}: NodeProps) {
  const d = data as unknown as ConceptNodeData;

  return (
    <div
      style={{
        border: `2px solid ${selected ? "#86efac" : "#16a34a"}`,
        borderRadius: 8,
        background: "#14532d",
        padding: "8px 14px",
        minWidth: 72,
        textAlign: "center",
        boxShadow: selected ? "0 0 0 3px rgba(22,163,74,0.4)" : undefined,
      }}
    >
      <div style={{ color: "#bbf7d0", fontSize: 14, fontWeight: 600 }}>
        {d.label}
      </div>
      <div
        style={{
          color: "#16a34a",
          fontSize: 9,
          letterSpacing: 0.5,
          marginTop: 2,
        }}
      >
        CONCEPT
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#16a34a" }}
      />
    </div>
  );
});
