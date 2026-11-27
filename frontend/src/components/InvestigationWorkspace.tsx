"use client";

import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitBranch,
  Layers,
  Eye,
  ExternalLink,
  Search,
  Check,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import EvidenceGraphCanvas from "@/components/EvidenceGraphCanvas";
import {
  Source,
  Claim,
  Conflict,
  Anomaly,
  TimelineEvent,
  GraphData,
  GraphNode
} from "@/types";

interface InvestigationWorkspaceProps {
  sources: Source[];
  claims: Claim[];
  conflicts: Conflict[];
  anomalies: Anomaly[];
  timeline: TimelineEvent[];
  graphData: GraphData;
  onUploadFiles: (files: FileList | null) => Promise<void>;
  onRequestResolveConflict: (conflict: Conflict, defaultResolution: string) => void;
  onRequestResolveAnomaly: (anomaly: Anomaly, defaultResolution: string) => void;
  onOpenModalProvenance: (claim: Claim) => void;
  isUploading: boolean;
  uploadProgress: number | null;
}

export default function InvestigationWorkspace({
  sources,
  claims,
  conflicts,
  anomalies,
  timeline,
  graphData,
  onUploadFiles,
  onRequestResolveConflict,
  onRequestResolveAnomaly,
  onOpenModalProvenance,
  isUploading,
  uploadProgress,
}: InvestigationWorkspaceProps) {
  const [sourceCategory, setSourceCategory] = useState<string>("all");
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [centerMode, setCenterMode] = useState<"relationships" | "graph" | "timeline">("relationships");
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(conflicts[0] || null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(claims[0] || null);
  const [expandedConflictIds, setExpandedConflictIds] = useState<Record<string, boolean>>({});
  const [sourceSearch, setSourceSearch] = useState("");

  // Sync default selection when data loads
  React.useEffect(() => {
    if (!selectedConflict && conflicts.length > 0) {
      setSelectedConflict(conflicts[0]);
    }
    if (!selectedClaim && claims.length > 0) {
      setSelectedClaim(claims[0]);
    }
  }, [conflicts, claims, selectedConflict, selectedClaim]);

  const filteredSources = sources.filter((s) => {
    const matchesCat =
      sourceCategory === "all" ||
      (sourceCategory === "tabular" && (s.file_type === "csv" || s.file_type === "excel")) ||
      s.file_type === sourceCategory;
    const matchesQuery = s.filename.toLowerCase().includes(sourceSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const visibleClaims = selectedSourceId
    ? claims.filter((c) => c.source_id === selectedSourceId)
    : claims;

  const visibleConflicts = selectedSourceId
    ? conflicts.filter(
        (cf) => cf.claim_a.source_id === selectedSourceId || cf.claim_b.source_id === selectedSourceId
      )
    : conflicts;

  const getFileIcon = (fileType: string) => {
    if (fileType === "csv" || fileType === "excel") return FileSpreadsheet;
    if (fileType === "image") return ImageIcon;
    if (fileType === "txt") return FileCode2;
    return FileText;
  };

  const handleGraphNodeSelect = (node: GraphNode) => {
    if (node.type === "CLAIM") {
      const matched = claims.find((c) => c.id === node.id);
      if (matched) {
        setSelectedClaim(matched);
        const linkedConf = conflicts.find(
          (cf) => cf.claim_a.id === matched.id || cf.claim_b.id === matched.id
        );
        if (linkedConf) setSelectedConflict(linkedConf);
      }
    } else if (node.type === "SOURCE") {
      setSelectedSourceId((prev) => (prev === node.id ? null : node.id));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedConflictIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Workspace Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#152338] border border-[#253A59] rounded-[12px] px-5 py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#3987F7]/15 border border-[#3987F7]/40 text-[#3987F7] font-mono text-[11px] font-semibold uppercase">
              3-Panel Intelligence Canvas
            </span>
            <span className="text-xs text-[#52749B]">
              {sources.length} Sources · {claims.length} Claims · {conflicts.length} Findings
            </span>
          </div>
          <h2 className="text-lg font-semibold text-white mt-1">
            EvidenceLoom Investigation Workspace
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {selectedSourceId && (
            <button
              type="button"
              onClick={() => setSelectedSourceId(null)}
              className="px-3 py-1.5 rounded-[10px] bg-[#101B2D] border border-[#3987F7]/50 text-xs text-[#EAF2FC] hover:bg-[#1D3557] transition"
            >
              Clear Source Filter ✕
            </button>
          )}
          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] bg-[#3987F7] hover:bg-[#2B76E5] text-white text-xs font-semibold cursor-pointer transition shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? `Uploading ${uploadProgress || 0}%` : "Ingest Evidence"}</span>
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={(e) => onUploadFiles(e.target.files)}
            />
          </label>
        </div>
      </div>

      {/* THREE-PANEL INVESTIGATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ============================================================ */}
        {/* LEFT PANEL: EVIDENCE EXPLORER & SOURCE CATEGORIES (3 cols) */}
        {/* ============================================================ */}
        <section className="lg:col-span-3 bg-[#152338] border border-[#253A59] rounded-[12px] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#253A59] pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#EAF2FC]">
              Evidence Explorer
            </h3>
            <span className="font-mono text-[11px] text-[#52749B]">{filteredSources.length} files</span>
          </div>

          {/* Search inside sources */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#52749B] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter documents..."
              value={sourceSearch}
              onChange={(e) => setSourceSearch(e.target.value)}
              className="w-full bg-[#101B2D] border border-[#253A59] rounded-[10px] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#52749B] focus:outline-none focus:border-[#3987F7]"
            />
          </div>

          {/* Source Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "All" },
              { id: "pdf", label: "PDF" },
              { id: "tabular", label: "Tabular" },
              { id: "image", label: "OCR Scan" },
              { id: "txt", label: "Logs" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSourceCategory(cat.id)}
                className={`px-2.5 py-1 rounded-[8px] text-[11px] font-medium transition ${
                  sourceCategory === cat.id
                    ? "bg-[#3987F7] text-white"
                    : "bg-[#101B2D] text-[#52749B] border border-[#253A59] hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Uploaded Documents List */}
          <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
            {filteredSources.map((src) => {
              const Icon = getFileIcon(src.file_type);
              const isSelected = selectedSourceId === src.id;
              const claimCountForSrc = claims.filter((c) => c.source_id === src.id).length;

              return (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => setSelectedSourceId(isSelected ? null : src.id)}
                  className={`w-full text-left p-3 rounded-[10px] border transition-all ${
                    isSelected
                      ? "bg-[#1D3557] border-[#3987F7] shadow-sm"
                      : "bg-[#101B2D] border-[#253A59] hover:border-[#52749B]"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-[8px] bg-[#152338] border border-[#253A59] flex items-center justify-center text-[#3987F7] shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate">
                        {src.filename}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#52749B] mt-1 font-mono">
                        <span>{src.file_type.toUpperCase()} · {(src.file_size / 1024).toFixed(1)}KB</span>
                        <span className="text-[#16B8A6]">{claimCountForSrc} claims</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="font-mono text-[10px] text-[#52749B] truncate max-w-[120px]">
                          #{src.file_hash.slice(0, 10)}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            src.status === "processed"
                              ? "bg-[#16B8A6]/15 text-[#16B8A6]"
                              : src.status === "failed"
                              ? "bg-[#E05252]/15 text-[#E05252]"
                              : "bg-[#3987F7]/15 text-[#3987F7]"
                          }`}
                        >
                          {src.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredSources.length === 0 && (
              <div className="text-center py-8 text-xs text-[#52749B] border border-dashed border-[#253A59] rounded-[10px]">
                No evidence matches this filter.
              </div>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* CENTER PANEL: RELATIONSHIPS, TIMELINES & CONNECTIONS (5 cols) */}
        {/* ============================================================ */}
        <section className="lg:col-span-5 bg-[#152338] border border-[#253A59] rounded-[12px] p-4 space-y-4">
          {/* Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#253A59] pb-3">
            <div className="flex items-center gap-1 bg-[#101B2D] p-1 rounded-[10px] border border-[#253A59]">
              {[
                { id: "relationships", label: "Claim Connections", icon: Layers },
                { id: "graph", label: "Evidence Graph", icon: GitBranch },
                { id: "timeline", label: "UTC Timeline", icon: Clock },
              ].map((m) => {
                const Icon = m.icon;
                const active = centerMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCenterMode(m.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition ${
                      active
                        ? "bg-[#3987F7] text-white shadow-sm"
                        : "text-[#52749B] hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CENTER MODE 1: CLAIM RELATIONSHIPS (Red Conflicts vs Teal Corroborated) */}
          {centerMode === "relationships" && (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {visibleConflicts.map((conf) => {
                const isCorroborated = conf.conflict_type === "corroboration";
                const isSelected = selectedConflict?.id === conf.id;
                const isExpanded = !!expandedConflictIds[conf.id];

                return (
                  <div
                    key={conf.id}
                    onClick={() => {
                      setSelectedConflict(conf);
                      setSelectedClaim(conf.claim_a);
                    }}
                    className={`rounded-[10px] border p-4 cursor-pointer transition-all space-y-2.5 ${
                      isCorroborated
                        ? isSelected
                          ? "bg-[#16B8A6]/12 border-[#16B8A6]"
                          : "bg-[#101B2D] border-[#16B8A6]/40 hover:border-[#16B8A6]"
                        : isSelected
                        ? "bg-[#E05252]/12 border-[#E05252]"
                        : "bg-[#101B2D] border-[#E05252]/40 hover:border-[#E05252]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {isCorroborated ? (
                            <CheckCircle2 className="w-4 h-4 text-[#16B8A6] shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-[#E05252] shrink-0" />
                          )}
                          <span className="text-sm font-semibold text-white">
                            {conf.entity} · {conf.attribute}
                          </span>
                        </div>
                        <div className="font-mono text-xs mt-1 flex items-center gap-2">
                          <span className={isCorroborated ? "text-[#16B8A6]" : "text-[#E05252]"}>
                            {conf.claim_a.raw_value} {conf.claim_a.unit || ""}
                          </span>
                          <span className="text-[#52749B]">vs</span>
                          <span className={isCorroborated ? "text-[#16B8A6]" : "text-[#E05252]"}>
                            {conf.claim_b.raw_value} {conf.claim_b.unit || ""}
                          </span>
                          {conf.unit_normalized && (
                            <span className="text-[#52749B]">
                              ({conf.value_a_normalized} vs {conf.value_b_normalized} {conf.unit_normalized})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold uppercase ${
                            isCorroborated
                              ? "bg-[#16B8A6]/20 text-[#16B8A6]"
                              : "bg-[#E05252]/20 text-[#E05252]"
                          }`}
                        >
                          {isCorroborated ? "Corroborated" : "Conflict"}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(conf.id);
                          }}
                          className="p-1 text-[#52749B] hover:text-white"
                          title="Expand Details"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#EAF2FC]/80 leading-relaxed">
                      {conf.explanation}
                    </p>

                    {isExpanded && (
                      <div className="pt-2 border-t border-[#253A59] grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-[#152338] p-2.5 rounded-[8px] border border-[#253A59]">
                          <div className="font-mono text-[#3987F7] truncate">
                            A: {conf.claim_a.source_filename}
                          </div>
                          <div className="text-[#EAF2FC]/70 mt-1 line-clamp-2">
                            &ldquo;{conf.claim_a.original_text}&rdquo;
                          </div>
                        </div>
                        <div className="bg-[#152338] p-2.5 rounded-[8px] border border-[#253A59]">
                          <div className="font-mono text-[#3987F7] truncate">
                            B: {conf.claim_b.source_filename}
                          </div>
                          <div className="text-[#EAF2FC]/70 mt-1 line-clamp-2">
                            &ldquo;{conf.claim_b.original_text}&rdquo;
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Standalone Structured Claims List */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#52749B] mb-2">
                  Extracted Claims ({visibleClaims.length})
                </div>
                <div className="space-y-2">
                  {visibleClaims.map((c) => {
                    const isSelected = selectedClaim?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedClaim(c);
                          const matchConf = conflicts.find(
                            (cf) => cf.claim_a.id === c.id || cf.claim_b.id === c.id
                          );
                          if (matchConf) setSelectedConflict(matchConf);
                        }}
                        className={`w-full text-left p-3 rounded-[10px] border transition flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-[#1D3557] border-[#3987F7]"
                            : "bg-[#101B2D] border-[#253A59] hover:border-[#52749B]"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">
                            {c.entity} — {c.attribute}:{" "}
                            <span className="font-mono text-[#3987F7]">
                              {c.raw_value} {c.unit || ""}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-[#52749B] truncate mt-0.5">
                            {c.source_filename}
                            {c.page_number ? ` · p.${c.page_number}` : ""}
                            {c.row_number ? ` · row ${c.row_number}` : ""}
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-[#16B8A6] shrink-0">
                          {(c.extraction_confidence * 100).toFixed(0)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CENTER MODE 2: INTERACTIVE EVIDENCE GRAPH */}
          {centerMode === "graph" && (
            <EvidenceGraphCanvas
              graphData={graphData}
              selectedNodeId={selectedClaim?.id || selectedSourceId}
              onSelectNode={handleGraphNodeSelect}
              heightClass="h-[520px]"
            />
          )}

          {/* CENTER MODE 3: CHRONOLOGICAL UTC TIMELINE */}
          {centerMode === "timeline" && (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {timeline.map((ev, idx) => (
                <div
                  key={ev.id || idx}
                  onClick={() => {
                    const matched = claims.find((c) => c.id === ev.id);
                    if (matched) setSelectedClaim(matched);
                  }}
                  className={`p-3.5 rounded-[10px] border cursor-pointer transition space-y-1.5 ${
                    ev.status === "conflict"
                      ? "bg-[#E05252]/10 border-[#E05252]/50"
                      : ev.status === "corroborated"
                      ? "bg-[#16B8A6]/10 border-[#16B8A6]/50"
                      : "bg-[#101B2D] border-[#253A59] hover:border-[#3987F7]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[#52749B]">
                      {new Date(ev.timestamp).toUTCString()}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded font-semibold ${
                        ev.status === "conflict"
                          ? "bg-[#E05252]/20 text-[#E05252]"
                          : ev.status === "corroborated"
                          ? "bg-[#16B8A6]/20 text-[#16B8A6]"
                          : "bg-[#3987F7]/20 text-[#3987F7]"
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {ev.entity} · {ev.attribute} ={" "}
                    <span className="font-mono text-[#3987F7]">
                      {ev.raw_value} {ev.unit || ""}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#EAF2FC]/70 font-mono truncate">
                    {ev.source_filename} · &ldquo;{ev.original_text}&rdquo;
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <div className="text-center py-10 text-xs text-[#52749B]">
                  No timestamped evidence events available.
                </div>
              )}
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* RIGHT PANEL: EVIDENCE INSPECTOR & VERIFICATION (4 cols) */}
        {/* ============================================================ */}
        <section className="lg:col-span-4 bg-[#152338] border border-[#253A59] rounded-[12px] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#253A59] pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#EAF2FC]">
              Evidence Inspector &amp; Verification
            </h3>
            <ShieldCheck className="w-4 h-4 text-[#16B8A6]" />
          </div>

          {/* Active Conflict / Verification Card */}
          {selectedConflict && (
            <div className="bg-[#101B2D] border border-[#253A59] rounded-[10px] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#52749B]">
                  Verification Verdict
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold uppercase ${
                    selectedConflict.conflict_type === "corroboration"
                      ? "bg-[#16B8A6]/20 text-[#16B8A6]"
                      : "bg-[#E05252]/20 text-[#E05252]"
                  }`}
                >
                  {selectedConflict.conflict_type === "corroboration"
                    ? "Corroborated"
                    : "Potential Conflict"}
                </span>
              </div>

              <div className="text-sm font-semibold text-white">
                {selectedConflict.entity} — {selectedConflict.attribute}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-[8px] bg-[#152338] border border-[#253A59]">
                  <span className="text-[10px] font-mono text-[#52749B] block">CLAIM A</span>
                  <span className="font-mono font-semibold text-white text-sm">
                    {selectedConflict.claim_a.raw_value} {selectedConflict.claim_a.unit || ""}
                  </span>
                  <span className="block text-[10px] text-[#3987F7] truncate mt-1">
                    {selectedConflict.claim_a.source_filename}
                  </span>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#152338] border border-[#253A59]">
                  <span className="text-[10px] font-mono text-[#52749B] block">CLAIM B</span>
                  <span className="font-mono font-semibold text-white text-sm">
                    {selectedConflict.claim_b.raw_value} {selectedConflict.claim_b.unit || ""}
                  </span>
                  <span className="block text-[10px] text-[#3987F7] truncate mt-1">
                    {selectedConflict.claim_b.source_filename}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#EAF2FC]/80 leading-relaxed">
                {selectedConflict.explanation}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#253A59]">
                <button
                  type="button"
                  onClick={() => onRequestResolveConflict(selectedConflict, "confirmed_conflict")}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#E05252] hover:bg-[#c94141] text-white text-xs font-semibold transition"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Confirm Conflict</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRequestResolveConflict(selectedConflict, "corroborated")}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#16B8A6] hover:bg-[#129b8c] text-[#101B2D] text-xs font-semibold transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Verify Match</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRequestResolveConflict(selectedConflict, "false_positive")}
                  className="px-3 py-1.5 rounded-[8px] bg-[#152338] border border-[#253A59] text-[#EAF2FC] hover:border-[#3987F7] text-xs transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Selected Claim Source Reference Box */}
          {selectedClaim ? (
            <div className="bg-[#101B2D] border border-[#253A59] rounded-[10px] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#52749B]">
                  Original Source Reference
                </span>
                <button
                  type="button"
                  onClick={() => onOpenModalProvenance(selectedClaim)}
                  className="text-xs text-[#3987F7] hover:underline flex items-center gap-1"
                >
                  <span>Full Trace</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#52749B]">Document</span>
                  <span className="font-mono text-white truncate max-w-[190px]">
                    {selectedClaim.source_filename}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52749B]">Coordinates</span>
                  <span className="font-mono text-[#EAF2FC]">
                    {selectedClaim.page_number ? `Page ${selectedClaim.page_number}` : ""}
                    {selectedClaim.row_number ? `Row ${selectedClaim.row_number}` : ""}
                    {!selectedClaim.page_number && !selectedClaim.row_number ? "Stream" : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52749B]">Method</span>
                  <span className="font-mono uppercase text-[#3987F7]">
                    {selectedClaim.extraction_method}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52749B]">Confidence</span>
                  <span className="font-mono text-[#16B8A6]">
                    {(selectedClaim.extraction_confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-[8px] bg-[#152338] border border-[#253A59] font-mono text-[11px] text-[#EAF2FC] leading-relaxed">
                &ldquo;{selectedClaim.original_text}&rdquo;
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-[#52749B] border border-dashed border-[#253A59] rounded-[10px]">
              Select a claim or node to inspect exact source provenance.
            </div>
          )}

          {/* Flagged Z-Score Anomalies Quick List */}
          {anomalies.length > 0 && (
            <div className="bg-[#101B2D] border border-[#E5A23B]/40 rounded-[10px] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#E5A23B]">
                  Statistical Outliers ({anomalies.length})
                </span>
                <span className="font-mono text-[10px] text-[#52749B]">|Z| ≥ 2.5σ</span>
              </div>
              {anomalies.slice(0, 2).map((anom) => (
                <div
                  key={anom.id}
                  className="text-xs border-t border-[#253A59] pt-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">
                      {anom.entity} · {anom.claim_value} {anom.unit}
                    </div>
                    <div className="font-mono text-[10px] text-[#E5A23B]">
                      Z = {anom.z_score}σ (μ={anom.mean_value})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRequestResolveAnomaly(anom, "confirmed_conflict")}
                    className="px-2 py-1 rounded bg-[#E5A23B]/20 text-[#E5A23B] text-[10px] font-semibold hover:bg-[#E5A23B]/30 shrink-0"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
