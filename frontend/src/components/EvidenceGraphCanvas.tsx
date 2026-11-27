"use client";

import React, { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { GraphData, GraphNode } from "@/types";

interface EvidenceGraphCanvasProps {
  graphData: GraphData;
  selectedNodeId?: string | null;
  onSelectNode?: (node: GraphNode) => void;
  heightClass?: string;
}

export default function EvidenceGraphCanvas({
  graphData,
  selectedNodeId,
  onSelectNode,
  heightClass = "h-[420px]",
}: EvidenceGraphCanvasProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const width = 820;
  const height = 420;
  const centerX = width / 2;
  const centerY = height / 2;

  // Deterministic radial / layered layout grouped by node type so edges always align accurately to actual node coordinates
  const nodePositions = React.useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const nodes = graphData.nodes;
    if (nodes.length === 0) return pos;

    const caseNodes = nodes.filter((n) => n.type === "CASE");
    const sourceNodes = nodes.filter((n) => n.type === "SOURCE");
    const entityNodes = nodes.filter((n) => n.type === "ENTITY");
    const claimNodes = nodes.filter((n) => n.type === "CLAIM");

    // Place Case Root at center-top or center
    caseNodes.forEach((n, idx) => {
      pos[n.id] = { x: centerX, y: 62 + idx * 40 };
    });

    // Place Sources on upper-left arc
    sourceNodes.forEach((n, idx) => {
      const total = Math.max(1, sourceNodes.length);
      const x = 130 + (idx * 240) / Math.max(1, total - 1 || 1);
      const spacing = total === 1 ? centerX - 180 : 110 + (idx / Math.max(1, total - 1)) * 220;
      pos[n.id] = { x: total === 1 ? 150 : spacing, y: 155 };
    });

    // Place Entities on upper-right arc
    entityNodes.forEach((n, idx) => {
      const total = Math.max(1, entityNodes.length);
      const spacing = total === 1 ? centerX + 180 : 480 + (idx / Math.max(1, total - 1)) * 220;
      pos[n.id] = { x: total === 1 ? 660 : spacing, y: 155 };
    });

    // Place Claims in lower band for clean conflict/corroboration arc inspection
    claimNodes.forEach((n, idx) => {
      const total = claimNodes.length;
      const margin = 85;
      const usableWidth = width - margin * 2;
      const x = total === 1 ? centerX : margin + (idx / Math.max(1, total - 1)) * usableWidth;
      const staggerY = idx % 2 === 0 ? 295 : 350;
      pos[n.id] = { x, y: staggerY };
    });

    // Fallback for any remaining nodes
    nodes.forEach((n, idx) => {
      if (!pos[n.id]) {
        const angle = (idx / nodes.length) * Math.PI * 2;
        pos[n.id] = {
          x: centerX + Math.cos(angle) * 160,
          y: centerY + Math.sin(angle) * 120,
        };
      }
    });

    return pos;
  }, [graphData.nodes]);

  const getNodeColors = (type: GraphNode["type"]) => {
    switch (type) {
      case "CASE":
        return { fill: "#1D3557", stroke: "#3987F7", text: "#FFFFFF" };
      case "SOURCE":
        return { fill: "#152338", stroke: "#3987F7", text: "#EAF2FC" };
      case "ENTITY":
        return { fill: "#101B2D", stroke: "#16B8A6", text: "#16B8A6" };
      case "CLAIM":
      default:
        return { fill: "#1A2B45", stroke: "#52749B", text: "#FFFFFF" };
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-[#EAF2FC]/80">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3987F7] inline-block" />
            <span>Case / Source</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16B8A6] inline-block" />
            <span>Entity</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#52749B] inline-block" />
            <span>Claim</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#16B8A6] inline-block" />
            <span className="text-[#16B8A6]">Corroborates</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#E05252] inline-block" />
            <span className="text-[#E05252]">Conflicts</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}
            className="p-1.5 rounded-[8px] bg-[#152338] border border-[#253A59] text-[#EAF2FC] hover:border-[#3987F7] transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-[#52749B] w-11 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))}
            className="p-1.5 rounded-[8px] bg-[#152338] border border-[#253A59] text-[#EAF2FC] hover:border-[#3987F7] transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-[8px] bg-[#152338] border border-[#253A59] text-[#EAF2FC] hover:border-[#3987F7] transition"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div
        className={`w-full ${heightClass} rounded-[10px] bg-[#0C1524] border border-[#253A59] relative overflow-auto flex items-center justify-center`}
      >
        {graphData.nodes.length === 0 ? (
          <div className="text-xs text-[#52749B]">
            No graph nodes generated yet. Upload evidence to build the topology.
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            className="w-full h-full transition-transform duration-200"
          >
            {/* Subtle Radial Grid */}
            <defs>
              <pattern id="ev-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#182740" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width={width} height={height} fill="url(#ev-grid)" />

            {/* Edges */}
            {graphData.edges.map((edge, idx) => {
              const p1 = nodePositions[edge.source];
              const p2 = nodePositions[edge.target];
              if (!p1 || !p2) return null;

              const isConflict = edge.label === "CONFLICTS_WITH";
              const isCorroborates = edge.label === "CORROBORATES";
              const strokeColor = isConflict
                ? "#E05252"
                : isCorroborates
                ? "#16B8A6"
                : "#2D466B";

              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2 - (isConflict || isCorroborates ? 24 : 0);

              return (
                <g key={edge.id || idx}>
                  {isConflict || isCorroborates ? (
                    <path
                      d={`M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={2.2}
                      strokeDasharray={isConflict ? "5 3" : undefined}
                    />
                  ) : (
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={strokeColor}
                      strokeWidth={1.2}
                      opacity={0.8}
                    />
                  )}
                  {(isConflict || isCorroborates) && (
                    <text
                      x={midX}
                      y={midY + 4}
                      textAnchor="middle"
                      fill={strokeColor}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      {isConflict ? "CONFLICT" : "CORROBORATES"}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {graphData.nodes.map((node) => {
              const p = nodePositions[node.id];
              if (!p) return null;
              const colors = getNodeColors(node.type);
              const isSelected = selectedNodeId === node.id || hoveredId === node.id;
              const boxWidth = Math.min(138, Math.max(88, node.label.length * 6.8 + 20));

              return (
                <g
                  key={node.id}
                  onClick={() => onSelectNode && onSelectNode(node)}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="cursor-pointer"
                >
                  <rect
                    x={p.x - boxWidth / 2}
                    y={p.y - 19}
                    width={boxWidth}
                    height={38}
                    rx={9}
                    fill={colors.fill}
                    stroke={isSelected ? "#FFFFFF" : colors.stroke}
                    strokeWidth={isSelected ? 2 : 1.3}
                  />
                  <text
                    x={p.x}
                    y={p.y - 3}
                    textAnchor="middle"
                    fill={colors.text}
                    fontSize="10"
                    fontWeight="600"
                  >
                    {node.label.length > 18 ? `${node.label.slice(0, 16)}…` : node.label}
                  </text>
                  <text
                    x={p.x}
                    y={p.y + 11}
                    textAnchor="middle"
                    fill="#52749B"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {node.type}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
