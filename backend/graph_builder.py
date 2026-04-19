"""Convert raw model analysis output into React Flow compatible node/edge dicts."""
from __future__ import annotations

from typing import Any


def build_graph(analysis: dict[str, Any]) -> dict[str, Any]:
    """
    Build a graph with three node types:
      - token   (blue rounded rect)  — one per input token
      - feature (purple circle)      — SAE features activated by each token
      - concept (green rounded rect) — top vocabulary tokens from SAE decoder direction

    Edges:
      - token → feature  (weight = activation value)
      - feature → concept (weight = concept score, normalised 0-1)
    """
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    seen_features: dict[int, str] = {}   # feat_idx → node_id (deduplicate shared features)
    seen_concepts: dict[str, str] = {}   # concept_token → node_id

    for token_item in analysis["token_data"]:
        token_str: str = token_item["token"]
        pos: int = token_item["pos"]
        token_node_id = f"token_{pos}"

        nodes.append(
            {
                "id": token_node_id,
                "type": "token",
                "data": {
                    "label": token_str,
                    "pos": pos,
                    "nodeType": "token",
                },
                "position": {"x": 0, "y": 0},  # Dagre will set real positions
            }
        )

        for feat in token_item.get("features", []):
            feat_idx: int = feat["feat_idx"]
            activation: float = feat["activation"]
            layer_key: str = feat["layer_key"]
            layer: int = feat["layer"]

            if feat_idx not in seen_features:
                feat_node_id = f"feature_{layer}_{feat_idx}"
                seen_features[feat_idx] = feat_node_id
                nodes.append(
                    {
                        "id": feat_node_id,
                        "type": "feature",
                        "data": {
                            "feat_idx": feat_idx,
                            "layer": layer,
                            "layer_key": layer_key,
                            "activation": activation,
                            "description": None,  # fetched lazily by frontend
                            "nodeType": "feature",
                        },
                        "position": {"x": 0, "y": 0},
                    }
                )
            else:
                feat_node_id = seen_features[feat_idx]

            edges.append(
                {
                    "id": f"e_{token_node_id}_{feat_node_id}",
                    "source": token_node_id,
                    "target": feat_node_id,
                    "data": {"weight": activation},
                    "type": "default",
                }
            )

            for concept in feat.get("concepts", []):
                concept_token: str = concept["token"]
                score: float = concept["score"]
                concept_key = f"{feat_idx}_{concept_token}"

                if concept_key not in seen_concepts:
                    concept_node_id = f"concept_{feat_idx}_{concept_token.replace(' ', '_')}"
                    seen_concepts[concept_key] = concept_node_id
                    nodes.append(
                        {
                            "id": concept_node_id,
                            "type": "concept",
                            "data": {
                                "label": concept_token,
                                "vocab_idx": concept["vocab_idx"],
                                "score": score,
                                "nodeType": "concept",
                            },
                            "position": {"x": 0, "y": 0},
                        }
                    )
                else:
                    concept_node_id = seen_concepts[concept_key]

                edges.append(
                    {
                        "id": f"e_{feat_node_id}_{concept_node_id}",
                        "source": feat_node_id,
                        "target": concept_node_id,
                        "data": {"weight": max(0.0, float(score))},
                        "type": "default",
                    }
                )

    return {"nodes": nodes, "edges": edges}
