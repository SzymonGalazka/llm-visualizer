import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeMouseHandler,
  BackgroundVariant,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";

import { TokenNode } from "./nodes/TokenNode";
import { FeatureNode } from "./nodes/FeatureNode";
import { ConceptNode } from "./nodes/ConceptNode";
import type { RawNode, RawEdge, AppNodeData } from "../types";

const nodeTypes = {
  token: TokenNode,
  feature: FeatureNode,
  concept: ConceptNode,
};

const NODE_WIDTHS: Record<string, number> = {
  token: 90,
  feature: 108,
  concept: 90,
};
const NODE_HEIGHT = 60;

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    ranksep: 130,
    nodesep: 55,
    marginx: 40,
    marginy: 40,
  });

  for (const node of nodes) {
    g.setNode(node.id, {
      width: NODE_WIDTHS[node.type ?? "token"] ?? 90,
      height: node.type === "feature" ? 108 : NODE_HEIGHT,
    });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    const w = NODE_WIDTHS[node.type ?? "token"] ?? 90;
    const h = node.type === "feature" ? 108 : NODE_HEIGHT;
    return { ...node, position: { x: pos.x - w / 2, y: pos.y - h / 2 } };
  });
}

function edgeStyle(weight: number): React.CSSProperties {
  const clamped = Math.min(Math.max(weight, 0), 20);
  const width = 1 + (clamped / 20) * 5;
  return { strokeWidth: width, stroke: "#6b7280" };
}

interface Props {
  rawNodes: RawNode[];
  rawEdges: RawEdge[];
  onNodeClick: (data: AppNodeData) => void;
}

export function GraphView({ rawNodes, rawEdges, onNodeClick }: Props) {
  // Convert raw API nodes/edges → React Flow nodes/edges with Dagre layout
  const [layoutNodes, layoutEdges] = useMemo(() => {
    const rfNodes: Node[] = rawNodes.map((n) => ({
      id: n.id,
      type: n.type,
      data: n.data,
      position: n.position,
    }));

    const rfEdges: Edge[] = rawEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: e.data,
      style: edgeStyle(e.data.weight),
      animated: false,
    }));

    const laid = applyDagreLayout(rfNodes, rfEdges);
    return [laid, rfEdges];
  }, [rawNodes, rawEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  // Sync when new data arrives
  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_evt, node) => {
      onNodeClick(node.data as unknown as AppNodeData);
    },
    [onNodeClick],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange as OnNodesChange}
      onEdgesChange={onEdgesChange as OnEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.2}
      maxZoom={3}
      style={{ background: "#0d0e12" }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="#1f2937"
      />
      <Controls
        style={{
          background: "#1f2937",
          border: "1px solid #374151",
          borderRadius: 8,
        }}
      />
      <MiniMap
        nodeColor={(n) => {
          if (n.type === "token") return "#3b82f6";
          if (n.type === "feature") return "#7c3aed";
          return "#16a34a";
        }}
        style={{ background: "#111827", border: "1px solid #374151" }}
      />
    </ReactFlow>
  );
}
