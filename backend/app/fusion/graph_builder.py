import networkx as nx
from typing import List, Dict, Any

class EvidenceGraphBuilder:
    """
    Constructs a connected multimodal evidence graph using NetworkX.
    Nodes: Cases, Sources, Entities, Claims
    Edges: CONTAINS, EXTRACTED_FROM, HAS_CLAIM, CONFLICTS_WITH, CORROBORATES
    """
    def build_graph(
        self,
        case: Dict[str, Any],
        sources: List[Dict[str, Any]],
        claims: List[Dict[str, Any]],
        conflicts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        G = nx.DiGraph()

        # 1. Root Case Node
        case_id = str(case["id"])
        G.add_node(
            case_id,
            label=case.get("title", "Case Root"),
            type="CASE",
            data={"status": case.get("status")}
        )

        # 2. Source Nodes
        for src in sources:
            s_id = str(src["id"])
            G.add_node(
                s_id,
                label=src.get("filename", "File"),
                type="SOURCE",
                data={"file_type": src.get("file_type"), "file_size": src.get("file_size")}
            )
            G.add_edge(case_id, s_id, id=f"{case_id}->{s_id}", label="CONTAINS", confidence=1.0)

        # 3. Entity Nodes
        entity_map = {}
        for c in claims:
            ent = c.get("entity")
            if ent and ent not in entity_map:
                ent_node_id = f"ent_{ent}"
                entity_map[ent] = ent_node_id
                G.add_node(
                    ent_node_id,
                    label=ent,
                    type="ENTITY",
                    data={"entity_name": ent}
                )

        # 4. Claim Nodes
        for c in claims:
            c_id = str(c["id"])
            label = f"{c.get('attribute')}: {c.get('raw_value')} {c.get('unit') or ''}".strip()
            G.add_node(
                c_id,
                label=label,
                type="CLAIM",
                data={
                    "entity": c.get("entity"),
                    "attribute": c.get("attribute"),
                    "confidence": c.get("extraction_confidence", 1.0),
                    "page": c.get("page_number"),
                    "row": c.get("row_number")
                }
            )
            # Edge from source to claim
            src_id = str(c.get("source_id"))
            if G.has_node(src_id):
                G.add_edge(src_id, c_id, id=f"{src_id}->{c_id}", label="EXTRACTED_FROM", confidence=c.get("extraction_confidence", 1.0))

            # Edge from entity to claim
            ent = c.get("entity")
            if ent in entity_map:
                G.add_edge(entity_map[ent], c_id, id=f"{entity_map[ent]}->{c_id}", label="HAS_CLAIM", confidence=1.0)

        # 5. Conflict & Corroboration Edges between Claims
        for conf in conflicts:
            ca = str(conf.get("claim_a_id"))
            cb = str(conf.get("claim_b_id"))
            if G.has_node(ca) and G.has_node(cb):
                edge_type = "CORROBORATES" if conf.get("conflict_type") == "corroboration" else "CONFLICTS_WITH"
                G.add_edge(ca, cb, id=f"{ca}<->{cb}", label=edge_type, confidence=1.0)

        # Convert to serializable format
        nodes = []
        for n, attrs in G.nodes(data=True):
            nodes.append({
                "id": n,
                "label": attrs.get("label", n),
                "type": attrs.get("type", "UNKNOWN"),
                "data": attrs.get("data", {})
            })

        edges = []
        for u, v, attrs in G.edges(data=True):
            edges.append({
                "id": attrs.get("id", f"{u}->{v}"),
                "source": u,
                "target": v,
                "label": attrs.get("label", "RELATED"),
                "confidence": attrs.get("confidence", 1.0)
            })

        return {"nodes": nodes, "edges": edges}

evidence_graph_builder = EvidenceGraphBuilder()
