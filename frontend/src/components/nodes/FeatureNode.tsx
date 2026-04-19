import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { BookOpen } from "lucide-react";
import type { FeatureNodeData } from "../../types";

export const FeatureNode = memo(function FeatureNode({
  data,
  selected,
}: NodeProps) {
  const d = data as unknown as FeatureNodeData;
  const label = d.description ?? `Feature #${d.feat_idx}`;
  // Truncate long descriptions for the node label
  const displayLabel = label.length > 28 ? label.slice(0, 26) + "…" : label;

  return (
    <div
      style={{
        border: `2px solid ${selected ? "#c084fc" : "#7c3aed"}`,
        borderRadius: "50%",
        background: "#2d1b4e",
        width: 108,
        height: 108,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 8,
        boxShadow: selected ? "0 0 0 3px rgba(124,58,237,0.4)" : undefined,
        cursor: "pointer",
      }}
    >
      <BookOpen size={16} color="#c084fc" style={{ marginBottom: 4 }} />
      <span
        style={{
          color: "#e9d5ff",
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 1.3,
        }}
      >
        {displayLabel}
      </span>
      <span
        style={{
          color: "#7c3aed",
          fontSize: 9,
          marginTop: 3,
          letterSpacing: 0.5,
        }}
      >
        FEATURE
      </span>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#7c3aed" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#7c3aed" }}
      />
    </div>
  );
});
