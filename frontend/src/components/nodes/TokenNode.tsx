import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { TokenNodeData } from "../../types";

export const TokenNode = memo(function TokenNode({
  data,
  selected,
}: NodeProps) {
  const d = data as unknown as TokenNodeData;
  return (
    <div
      className="flex flex-col items-center gap-0.5"
      style={{
        border: `2px solid ${selected ? "#93c5fd" : "#3b82f6"}`,
        borderRadius: 8,
        background: "#1e3a5f",
        padding: "8px 16px",
        minWidth: 72,
        textAlign: "center",
        boxShadow: selected ? "0 0 0 3px rgba(59,130,246,0.4)" : undefined,
      }}
    >
      <span
        style={{
          color: "#bfdbfe",
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: 0.5,
        }}
      >
        {d.label}
      </span>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#3b82f6" }}
      />
    </div>
  );
});
