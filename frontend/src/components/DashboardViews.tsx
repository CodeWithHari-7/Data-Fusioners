"use client";

import React, { useState } from "react";
import {
  Shield,
  FileText,
  AlertTriangle,
  Clock,
  Search,
  Upload,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sliders,
  Cpu,
  Eye,
  Info,
  Check,
  Radio,
  Network
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from "recharts";
import EvidenceGraphCanvas from "@/components/EvidenceGraphCanvas";
import {
  Case,
  Source,
  Claim,
  Conflict,
  Anomaly,
  GraphData,
  TimelineEvent,
  Review,
  SystemHealth
} from "@/types";

interface DashboardViewsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentCase?: Case;
  sources: Source[];
  claims: Claim[];
  conflicts: Conflict[];
  anomalies: Anomaly[];
  timeline: TimelineEvent[];
  graphData: GraphData;
  reviews: Review[];
  health: SystemHealth | null;
  claimSearch: string;
  setClaimSearch: (v: string) => void;
  conflictFilter: string;
  setConflictFilter: (v: string) => void;
  isUploading: boolean;
  uploadProgress: number | null;
  uploadMessage: string | null;
  onRefresh: () => void;
  onUploadFiles: (files: FileList | null) => Promise<void>;
  onOpenProvenance: (claim: Claim) => void;
  onRequestResolveConflict: (conflict: Conflict, defaultRes: string) => void;
  onRequestResolveAnomaly: (anomaly: Anomaly, defaultRes: string) => void;
  onSaveSettings: (msg: string) => void;
}

export default function DashboardViews({
  activeTab,
  setActiveTab,
  currentCase,
  sources,
  claims,
  conflicts,
  anomalies,
  timeline,
  graphData,
  reviews,
  health,
  claimSearch,
  setClaimSearch,
  conflictFilter,
  setConflictFilter,
  isUploading,
  uploadProgress,
  uploadMessage,
  onRefresh,
  onUploadFiles,
  onOpenProvenance,
  onRequestResolveConflict,
  onRequestResolveAnomaly,
  onSaveSettings,
}: DashboardViewsProps) {
  const [selectedViewerClaim, setSelectedViewerClaim] = useState<Claim | null>(claims[0] || null);
  const [toleranceInput, setToleranceInput] = useState("2.0");
  const [zScoreInput, setZScoreInput] = useState("2.5");
  const [fuzzyInput, setFuzzyInput] = useState("85");

  React.useEffect(() => {
    if (!selectedViewerClaim && claims.length > 0) {
      setSelectedViewerClaim(claims[0]);
    }
  }, [claims, selectedViewerClaim]);

  const totalClaims = claims.length;
  const corroborationCount = conflicts.filter((c) => c.conflict_type === "corroboration").length;
  const activeConflictCount = conflicts.filter(
    (c) => c.conflict_type !== "corroboration" && c.status === "detected"
  ).length;

  // Real summary bar breakdown derived strictly from current state
  const summaryChartData = [
    { name: "Sources", count: sources.length, color: "#3987F7" },
    { name: "Claims", count: totalClaims, color: "#52749B" },
    { name: "Corroborated", count: corroborationCount, color: "#16B8A6" },
    { name: "Conflicts", count: activeConflictCount, color: "#E05252" },
    { name: "Anomalies", count: anomalies.length, color: "#E5A23B" },
  ];

  /* ============================================================== */
  /* 1. DASHBOARD OVERVIEW                                          */
  /* ============================================================== */
  if (activeTab === "dashboard") {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Case Hero Banner */}
        <div className="bg-[#152338] border border-[#253A59] rounded-[12px] p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#52749B]">
                  Active Investigation
                </span>
                <span className="px-2 py-0.5 rounded bg-[#16B8A6]/15 border border-[#16B8A6]/40 text-[#16B8A6] font-mono text-[10px] font-semibold uppercase">
                  {currentCase?.status || "Active"}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {currentCase?.title || "Evidence Investigation"}
              </h2>
              <p className="text-sm text-[#EAF2FC]/75 max-w-3xl leading-relaxed">
                {currentCase?.description ||
                  "Multimodal evidence fusion active. Cross-referencing telemetry, PDF specifications, scanned meters, and tabular logs."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab("workspace")}
                className="px-4 py-2.5 bg-[#3987F7] hover:bg-[#2B76E5] text-white rounded-[10px] text-sm font-semibold transition flex items-center gap-2 shadow-sm"
              >
                <Network className="w-4 h-4" />
                <span>Open 3-Panel Workspace</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className="px-4 py-2.5 bg-[#1D3557] hover:bg-[#25426B] border border-[#253A59] text-white rounded-[10px] text-sm font-medium transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4 text-[#3987F7]" />
                <span>Upload Evidence</span>
              </button>
              <button
                type="button"
                onClick={onRefresh}
                className="p-2.5 bg-[#101B2D] border border-[#253A59] rounded-[10px] hover:border-[#3987F7] text-[#EAF2FC] transition"
                title="Refresh Live Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* KPI Statistical Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#152338] border border-[#253A59] rounded-[12px] p-5 space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-[#52749B] block">
              Evidence Sources
            </span>
            <span className="font-mono text-3xl font-bold text-white block">{sources.length}</span>
            <span className="text-xs text-[#3987F7] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> PDF, CSV, Scans, Logs
            </span>
          </div>

          <div className="bg-[#152338] border border-[#253A59] rounded-[12px] p-5 space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-[#52749B] block">
              Structured Claims
            </span>
            <span className="font-mono text-3xl font-bold text-white block">{totalClaims}</span>
            <span className="text-xs text-[#16B8A6] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Calibrated Provenance
            </span>
          </div>

          <div className="bg-[#152338] border border-[#253A59] rounded-[12px] p-5 space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-[#52749B] block">
              Corroborated Pairs
            </span>
            <span className="font-mono text-3xl font-bold text-[#16B8A6] block">
              {corroborationCount}
            </span>
            <span className="text-xs text-[#16B8A6] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Pint Unit-Normalized
            </span>
          </div>

          <div className="bg-[#152338] border border-[#253A59] rounded-[12px] p-5 space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-[#52749B] block">
              Active Conflicts
            </span>
            <span className="font-mono text-3xl font-bold text-[#E05252] block">
              {activeConflictCount}
            </span>
            <span className="text-xs text-[#E05252] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Requires Analyst Review
            </span>
          </div>
        </div>

        {/* Analytics Charts Row (Pipeline Distribution + Parameter Trend) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-[#152338] border border-[#253A59] rounded-[12px] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#253A59] pb-3">
              <h3 className="text-sm font-semibold text-white">Case Evidence Distribution</h3>
              <span className="font-mono text-[11px] text-[#52749B]">LIVE COUNTS</span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#253A59" vertical={false} />
                  <XAxis dataKey="name" stroke="#52749B" fontSize={11} />
                  <YAxis stroke="#52749B" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#101B2D",
                      borderColor: "#253A59",
                      borderRadius: "10px",
                      fontSize: "12px",
                      color: "#FFFFFF",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {summaryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#152338] border border-[#253A59] rounded-[12px] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#253A59] pb-3">
              <h3 className="text-sm font-semibold text-white">UTC Normalized Measurements</h3>
              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className="text-xs text-[#3987F7] hover:underline flex items-center gap-1"
              >
                Full Timeline <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#253A59" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(t) =>
                      t ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""
                    }
                    stroke="#52749B"
                    fontSize={11}
                  />
                  <YAxis stroke="#52749B" fontSize={11} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as TimelineEvent;
                        return (
                          <div className="bg-[#101B2D] border border-[#253A59] p-3 rounded-[10px] shadow-xl text-xs space-y-1">
                            <p className="font-semibold text-white">
                              {d.entity} — {d.attribute}
                            </p>
                            <p className="font-mono text-[#3987F7]">
                              {d.raw_value} {d.unit} ({d.normalized_value} {d.normalized_unit})
                            </p>
                            <p className="text-[#52749B]">{d.source_filename}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="normalized_value"
                    stroke="#3987F7"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: "#16B8A6", stroke: "#101B2D", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pipeline Banner */}
        <div className="bg-[#1D3557]/60 border border-[#3987F7]/40 rounded-[12px] p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#3987F7] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[#EAF2FC] leading-relaxed">
            <strong className="font-semibold text-white">Deterministic Verification Guarantee:</strong>{" "}
            Layered conflict resolution verifies entity identity, attribute compatibility, overlapping UTC windows, and Pint unit equivalence (e.g.{" "}
            <span className="font-mono text-[#16B8A6]">95°C ≡ 203°F</span>) before flagging contradictions.
          </div>
        </div>

        {/* Two-Column Conflict & Anomaly Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conflicts */}
          <div className="bg-[#152338] border border-[#253A59] rounded-[12px] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#253A59] pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#E05252]" />
                <span>Discrepancy &amp; Corroboration Feed</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab("conflicts")}
                className="text-xs text-[#3987F7] hover:underline flex items-center gap-1"
              >
                View All ({conflicts.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {conflicts.slice(0, 3).map((conf) => {
                const isCorroborated = conf.conflict_type === "corroboration";
                return (
                  <div
                    key={conf.id}
                    className={`p-4 rounded-[10px] border text-sm space-y-2 ${
                      isCorroborated
                        ? "bg-[#16B8A6]/10 border-[#16B8A6]/40"
                        : "bg-[#E05252]/10 border-[#E05252]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {conf.entity} — {conf.attribute}
                      </span>
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                          isCorroborated
                            ? "bg-[#16B8A6]/20 text-[#16B8A6]"
                            : "bg-[#E05252]/20 text-[#E05252]"
                        }`}
                      >
                        {isCorroborated ? "Corroborated" : "Conflict"}
                      </span>
                    </div>
                    <p className="text-xs text-[#EAF2FC]/80 leading-relaxed">
                      {conf.explanation}
                    </p>
                    <div className="flex items-center justify-between text-xs text-[#52749B] pt-2 border-t border-[#253A59]/70">
                      <span className="font-mono">Tolerance: {conf.tolerance_applied}%</span>
                      <button
                        type="button"
                        onClick={() => onOpenProvenance(conf.claim_a)}
                        className="text-[#3987F7] hover:underline flex items-center gap-1"
                      >
                        Trace Sources <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {conflicts.length === 0 && (
                <div className="text-center py-8 text-xs text-[#52749B]">
                  No conflicts or corroborations detected yet.
                </div>
              )}
            </div>
          </div>

          {/* Anomalies */}
          <div className="bg-[#152338] border border-[#253A59] rounded-[12px] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#253A59] pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#E5A23B]" />
                <span>Statistical Outliers (Z-Score)</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab("anomalies")}
                className="text-xs text-[#3987F7] hover:underline flex items-center gap-1"
              >
                View All ({anomalies.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {anomalies.slice(0, 3).map((anom) => (
                <div
                  key={anom.id}
                  className="p-4 rounded-[10px] border border-[#E5A23B]/40 bg-[#E5A23B]/10 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">
                      {anom.entity} · {anom.attribute}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#E5A23B]/20 text-[#E5A23B] font-semibold">
                      Z: {anom.z_score > 0 ? `+${anom.z_score}` : anom.z_score}σ
                    </span>
                  </div>
                  <p className="text-xs text-[#EAF2FC]/80 leading-relaxed">
                    {anom.explanation}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#52749B] pt-2 border-t border-[#253A59]/70">
                    <span className="font-mono text-[#EAF2FC]">
                      Value: {anom.claim_value} {anom.unit} | μ={anom.mean_value}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRequestResolveAnomaly(anom, "confirmed_conflict")}
                      className="text-[#E5A23B] hover:underline font-medium"
                    >
                      Review Flag
                    </button>
                  </div>
                </div>
              ))}
              {anomalies.length === 0 && (
                <div className="text-center py-8 text-xs text-[#52749B]">
                  No statistical outliers flagged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================== */
  /* 2. EVIDENCE UPLOAD VIEW                                        */
  /* ============================================================== */
  if (activeTab === "upload") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
        <div className="bg-[#152338] border border-[#253A59] rounded-[12px] p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-white">Multimodal Evidence Ingestion</h2>
            <p className="text-sm text-[#EAF2FC]/70 mt-1">
              Upload PDF specifications, scanned gauge images, PNG/JPG photos, CSV telemetry, Excel spreadsheets, or TXT operator logs.
            </p>
          </div>

          <div
            className="border-2 border-dashed border-[#253A59] hover:border-[#3987F7] rounded-[12px] p-10 text-center transition cursor-pointer bg-[#101B2D]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onUploadFiles(e.dataTransfer.files);
            }}
            onClick={() => {
              const input = document.getElementById("df-file-input");
              if (input) input.click();
            }}
          >
            <input
              id="df-file-input"
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={(e) => onUploadFiles(e.target.files)}
            />
            <div className="w-12 h-12 mx-auto rounded-[12px] bg-[#3987F7]/15 border border-[#3987F7]/40 flex items-center justify-center text-[#3987F7] mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-white text-base">
              Drag and drop files here, or click to browse
            </h3>
            <p className="text-xs text-[#52749B] mt-1 font-mono">
              PDF · PNG · JPG · CSV · XLSX · XLS · TXT (MAX 50MB)
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] font-mono text-[#EAF2FC]/80">
              <span className="px-2.5 py-1 bg-[#152338] border border-[#253A59] rounded-[8px]">PyMuPDF Tables</span>
              <span className="px-2.5 py-1 bg-[#152338] border border-[#253A59] rounded-[8px]">OpenCV + Tesseract</span>
              <span className="px-2.5 py-1 bg-[#152338] border border-[#253A59] rounded-[8px]">SHA-256 Dedup</span>
              <span className="px-2.5 py-1 bg-[#152338] border border-[#253A59] rounded-[8px]">Magic Bytes Check</span>
            </div>
          </div>

          {isUploading && (
            <div className="p-4 border border-[#3987F7]/40 bg-[#3987F7]/10 rounded-[10px] space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-[#EAF2FC]">
                <span>{uploadMessage}</span>
                <span className="font-mono text-[#3987F7]">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#101B2D] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#3987F7] h-2 transition-all duration-300"
                  style={{ width: `${uploadProgress || 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#152338] border border-[#253A59] rounded-[12px] p-5 space-y-3">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#16B8A6]" />
            <span>Zero-Trust Ingestion Controls</span>
          </h3>
          <ul className="text-xs text-[#EAF2FC]/80 space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16B8A6] shrink-0" />
              <span><strong>Magic Byte Signature Check:</strong> Rejects executables or scripts disguised with safe extensions.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16B8A6] shrink-0" />
              <span><strong>SHA-256 Deduplication:</strong> Prevents redundant processing of identical evidence artifacts.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16B8A6] shrink-0" />
              <span><strong>Path Traversal Protection:</strong> Sanitizes filenames and isolates files under UUID paths.</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  /* ============================================================== */
  /* 3. EVIDENCE EXPLORER VIEW                                      */
  /* ============================================================== */
  if (activeTab === "explorer") {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Evidence Explorer</h2>
            <p className="text-sm text-[#52749B]">
              {sources.length} multimodal evidence sources indexed for this case.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className="px-4 py-2 bg-[#3987F7] hover:bg-[#2B76E5] text-white rounded-[10px] text-sm font-semibold transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Add Evidence</span>
          </button>
        </div>

        <div className="bg-[#152338] border border-[#253A59] rounded-[12px] overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#253A59] bg-[#101B2D] text-[#52749B] text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4">Filename</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">SHA-256 Hash</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#253A59]">
              {sources.map((src) => (
                <tr key={src.id} className="hover:bg-[#1D3557]/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#3987F7]" />
                    <span>{src.filename}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-[6px] text-xs font-mono uppercase bg-[#101B2D] border border-[#253A59] text-[#EAF2FC]">
                      {src.file_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#52749B]">
                    {(src.file_size / 1024).toFixed(1)} KB
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#52749B]" title={src.file_hash}>
                    {src.file_hash.slice(0, 16)}...
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-xs uppercase font-semibold ${
                        src.status === "processed"
                          ? "bg-[#16B8A6]/15 text-[#16B8A6]"
                          : src.status === "failed"
                          ? "bg-[#E05252]/15 text-[#E05252]"
                          : "bg-[#3987F7]/15 text-[#3987F7]"
                      }`}
                    >
                      {src.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        const c = claims.find((item) => item.source_id === src.id);
                        if (c) onOpenProvenance(c);
                        else onSaveSettings("No claims extracted from this source yet.");
                      }}
                      className="text-xs text-[#3987F7] hover:underline font-medium"
                    >
                      Inspect Claims
                    </button>
                  </td>
                </tr>
              ))}
              {sources.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[#52749B]">
                    No evidence uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ============================================================== */
  /* 4. STRUCTURED CLAIMS VIEW                                      */
  /* ============================================================== */
  if (activeTab === "claims") {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Structured Claims &amp; Provenance</h2>
            <p className="text-sm text-[#52749B]">
              Every extracted claim links back to its exact file, page/row coordinate, and confidence score.
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#52749B] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter claims, entities, units..."
              value={claimSearch}
              onChange={(e) => setClaimSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#152338] border border-[#253A59] rounded-[10px] text-sm text-white placeholder-[#52749B] w-72 focus:outline-none focus:border-[#3987F7]"
            />
          </div>
        </div>

        <div className="bg-[#152338] border border-[#253A59] rounded-[12px] overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#253A59] bg-[#101B2D] text-[#52749B] text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Attribute</th>
                <th className="py-3.5 px-4">Extracted</th>
                <th className="py-3.5 px-4">Canonical SI</th>
                <th className="py-3.5 px-4">Time (UTC)</th>
                <th className="py-3.5 px-4">Provenance</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#253A59]">
              {claims
                .filter(
                  (c) =>
                    c.entity.toLowerCase().includes(claimSearch.toLowerCase()) ||
                    c.attribute.toLowerCase().includes(claimSearch.toLowerCase()) ||
                    c.original_text.toLowerCase().includes(claimSearch.toLowerCase())
                )
                .map((c) => (
                  <tr key={c.id} className="hover:bg-[#1D3557]/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">{c.entity}</td>
                    <td className="py-3.5 px-4 text-[#EAF2FC]">{c.attribute}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#3987F7]">
                      {c.raw_value} {c.unit || ""}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#16B8A6]">
                      {c.normalized_value !== undefined && c.normalized_value !== null
                        ? `${c.normalized_value} ${c.normalized_unit || ""}`
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#52749B]">
                      {c.timestamp ? new Date(c.timestamp).toUTCString().slice(5, 22) : "Unbounded"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#EAF2FC]/80">
                      <span className="font-medium text-white">{c.source_filename || "Document"}</span>
                      {c.page_number && ` (p.${c.page_number})`}
                      {c.row_number && ` (row ${c.row_number})`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded bg-[#16B8A6]/15 text-[#16B8A6] font-semibold">
                        {(c.extraction_confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenProvenance(c)}
                        className="p-1.5 rounded-[8px] hover:bg-[#101B2D] text-[#3987F7] transition"
                        title="Inspect Excerpt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              {claims.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-[#52749B]">
                    No structured claims extracted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ============================================================== */
  /* 5. CONFLICT CENTER VIEW                                        */
  /* ============================================================== */
  if (activeTab === "conflicts") {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Conflict Center</h2>
            <p className="text-sm text-[#52749B]">
              Layered verification: Entity &rarr; Attribute &rarr; UTC Window &rarr; Pint Units &rarr; Tolerance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: "all", label: `All (${conflicts.length})`, activeClass: "bg-[#3987F7] text-white" },
              {
                id: "conflicts",
                label: `Conflicts (${conflicts.filter((c) => c.conflict_type !== "corroboration").length})`,
                activeClass: "bg-[#E05252] text-white",
              },
              {
                id: "corroborated",
                label: `Corroborated (${conflicts.filter((c) => c.conflict_type === "corroboration").length})`,
                activeClass: "bg-[#16B8A6] text-[#101B2D]",
              },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setConflictFilter(f.id)}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold transition ${
                  conflictFilter === f.id
                    ? f.activeClass
                    : "bg-[#152338] border border-[#253A59] text-[#EAF2FC]/80 hover:border-[#3987F7]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {conflicts
            .filter((conf) => {
              if (conflictFilter === "conflicts") return conf.conflict_type !== "corroboration";
              if (conflictFilter === "corroborated") return conf.conflict_type === "corroboration";
              return true;
            })
            .map((conf) => {
              const isCorroborated = conf.conflict_type === "corroboration";
              return (
                <div
                  key={conf.id}
                  className={`bg-[#152338] border rounded-[12px] p-5 space-y-4 ${
                    isCorroborated ? "border-[#16B8A6]/50" : "border-[#E05252]/60"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#253A59] pb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-0.5 rounded font-mono text-[11px] uppercase font-semibold ${
                          isCorroborated
                            ? "bg-[#16B8A6]/20 text-[#16B8A6]"
                            : "bg-[#E05252]/20 text-[#E05252]"
                        }`}
                      >
                        {isCorroborated ? "Corroborated" : "Potential Contradiction"}
                      </span>
                      <h3 className="text-base font-semibold text-white">
                        {conf.entity} — {conf.attribute}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#52749B]">
                        STATUS: <strong className="text-white uppercase">{conf.status}</strong>
                      </span>
                      {conf.status === "detected" && (
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            type="button"
                            onClick={() => onRequestResolveConflict(conf, "confirmed_conflict")}
                            className="px-3 py-1.5 text-xs bg-[#E05252] hover:bg-[#c94141] text-white rounded-[8px] font-semibold transition"
                          >
                            Confirm Conflict
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestResolveConflict(conf, "false_positive")}
                            className="px-3 py-1.5 text-xs bg-[#101B2D] border border-[#253A59] hover:border-[#3987F7] text-[#EAF2FC] rounded-[8px] transition"
                          >
                            False Positive
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-[#EAF2FC]/85 leading-relaxed bg-[#101B2D] p-3.5 rounded-[10px] border border-[#253A59]">
                    {conf.explanation}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Source Claim A", claim: conf.claim_a, norm: conf.value_a_normalized },
                      { label: "Source Claim B", claim: conf.claim_b, norm: conf.value_b_normalized },
                    ].map((side) => (
                      <div
                        key={side.label}
                        className="bg-[#101B2D] border border-[#253A59] rounded-[10px] p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs border-b border-[#253A59] pb-2">
                          <span className="font-semibold text-[#3987F7] uppercase">{side.label}</span>
                          <span className="font-mono text-[#52749B]">ID: {side.claim.id.slice(0, 8)}</span>
                        </div>
                        <div className="font-mono text-lg font-bold text-white">
                          {side.claim.raw_value} {side.claim.unit || ""}
                          {side.norm !== undefined && (
                            <span className="text-xs font-normal text-[#16B8A6] ml-2">
                              (SI: {side.norm} {conf.unit_normalized})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#52749B]">
                          <strong className="text-[#EAF2FC]">Origin:</strong> {side.claim.source_filename || "Document"}
                          {side.claim.page_number ? ` · Page ${side.claim.page_number}` : ""}
                          {side.claim.row_number ? ` · Row ${side.claim.row_number}` : ""}
                        </div>
                        <div className="font-mono text-[11px] bg-[#152338] p-2.5 rounded-[8px] text-[#EAF2FC]/80 border border-[#253A59]">
                          &ldquo;{side.claim.original_text}&rdquo;
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          {conflicts.length === 0 && (
            <div className="text-center py-12 bg-[#152338] border border-[#253A59] rounded-[12px] text-[#52749B]">
              No conflict records currently active.
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ============================================================== */
  /* 6. ANOMALY CENTER VIEW                                         */
  /* ============================================================== */
  if (activeTab === "anomalies") {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h2 className="text-xl font-bold text-white">Statistical Anomaly Center</h2>
          <p className="text-sm text-[#52749B]">
            Empirical Z-score anomaly detection flags measurements deviating &gt;2.5σ from group mean as signals, not proof.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {anomalies.map((anom) => (
            <div
              key={anom.id}
              className="bg-[#152338] border border-[#E5A23B]/50 rounded-[12px] p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base text-white">
                    {anom.entity} · {anom.attribute}
                  </h3>
                  <span className="font-mono text-xs text-[#52749B]">
                    σ = ±{anom.std_dev} | μ = {anom.mean_value}
                  </span>
                </div>
                <span className="px-3 py-1 bg-[#E5A23B]/20 text-[#E5A23B] font-mono font-bold rounded-[8px] text-xs">
                  Z = {anom.z_score > 0 ? `+${anom.z_score}` : anom.z_score}σ
                </span>
              </div>

              <p className="text-xs text-[#EAF2FC]/85 leading-relaxed bg-[#101B2D] p-3 rounded-[10px] border border-[#253A59]">
                {anom.explanation}
              </p>

              <div className="border-t border-[#253A59] pt-3 flex items-center justify-between text-xs">
                <span className="font-mono text-white">
                  Measured: {anom.claim_value} {anom.unit}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onRequestResolveAnomaly(anom, "confirmed_conflict")}
                    className="px-3 py-1.5 bg-[#E5A23B] text-[#101B2D] rounded-[8px] font-semibold hover:opacity-90 transition"
                  >
                    Confirm Anomaly
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestResolveAnomaly(anom, "dismissed")}
                    className="px-3 py-1.5 bg-[#101B2D] border border-[#253A59] rounded-[8px] text-[#EAF2FC] hover:border-[#3987F7] transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
          {anomalies.length === 0 && (
            <div className="col-span-2 text-center py-12 bg-[#152338] border border-[#253A59] rounded-[12px] text-[#52749B]">
              No statistical anomalies detected.
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ============================================================== */
  /* 7. TIMELINE & TRENDS VIEW                                      */
  /* ============================================================== */
  if (activeTab === "timeline") {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h2 className="text-xl font-bold text-white">Chronological Evidence Timeline</h2>
          <p className="text-sm text-[#52749B]">
            Multimodal measurement sequence aligned to UTC.
          </p>
        </div>

        <div className="bg-[#152338] border border-[#253A59] rounded-[12px] p-5 space-y-3">
          <h3 className="text-xs font-semibold text-[#52749B] uppercase tracking-wider">
            Normalized Parameter Trends Over Time
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#253A59" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) =>
                    t ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""
                  }
                  stroke="#52749B"
                  fontSize={11}
                />
                <YAxis stroke="#52749B" fontSize={11} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as TimelineEvent;
                      return (
                        <div className="bg-[#101B2D] border border-[#253A59] p-3 rounded-[10px] shadow text-xs space-y-1">
                          <p className="font-semibold text-white">
                            {d.entity} — {d.attribute}
                          </p>
                          <p className="font-mono text-[#3987F7]">
                            {d.raw_value} {d.unit}
                          </p>
                          <p className="text-[#52749B]">{d.source_filename}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="normalized_value"
                  stroke="#3987F7"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "#16B8A6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3">
          {timeline.map((ev, idx) => (
            <div
              key={ev.id || idx}
              className="bg-[#152338] border border-[#253A59] rounded-[12px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {ev.status === "conflict" ? (
                    <AlertTriangle className="w-4 h-4 text-[#E05252]" />
                  ) : ev.status === "corroborated" ? (
                    <CheckCircle2 className="w-4 h-4 text-[#16B8A6]" />
                  ) : (
                    <Clock className="w-4 h-4 text-[#3987F7]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">
                      {ev.entity} — {ev.attribute}:{" "}
                      <span className="font-mono text-[#3987F7]">
                        {ev.raw_value} {ev.unit || ""}
                      </span>
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
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
                  <p className="font-mono text-xs text-[#52749B] mt-0.5">
                    {new Date(ev.timestamp).toUTCString()} | {ev.source_filename}
                    {ev.page_number ? ` (p.${ev.page_number})` : ""}
                    {ev.row_number ? ` (row ${ev.row_number})` : ""}
                  </p>
                  <p className="font-mono text-xs text-[#EAF2FC]/80 mt-1">&ldquo;{ev.original_text}&rdquo;</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const c = claims.find((item) => item.id === ev.id);
                  if (c) onOpenProvenance(c);
                }}
                className="text-xs text-[#3987F7] hover:underline flex items-center gap-1 self-end md:self-auto"
              >
                Trace Origin <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ============================================================== */
  /* 8. EVIDENCE GRAPH VIEW                                         */
  /* ============================================================== */
  if (activeTab === "graph") {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div>
          <h2 className="text-xl font-bold text-white">Evidence &amp; Provenance Graph</h2>
          <p className="text-sm text-[#52749B]">
            NetworkX topology: Case &rarr; Source &rarr; Entity &rarr; Claims &rarr; Conflict / Corroboration Edges.
          </p>
        </div>

        <div className="bg-[#152338] border border-[#253A59] rounded-[12px] p-5 space-y-5">
          <EvidenceGraphCanvas
            graphData={graphData}
            onSelectNode={(node) => {
              if (node.type === "CLAIM") {
                const c = claims.find((item) => item.id === node.id);
                if (c) onOpenProvenance(c);
              }
            }}
            heightClass="h-[460px]"
          />

          <div>
            <h4 className="text-xs uppercase font-semibold text-[#52749B] tracking-wider mb-2.5">
              Graph Nodes ({graphData.nodes.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              {graphData.nodes.map((n) => (
                <div
                  key={n.id}
                  className="border border-[#253A59] p-2.5 rounded-[10px] bg-[#101B2D]"
                >
                  <strong className="block text-white truncate">{n.label}</strong>
                  <span className="font-mono text-[10px] text-[#3987F7] uppercase">{n.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================== */
  /* 9. SOURCE VIEWER VIEW                                          */
  /* ============================================================== */
  if (activeTab === "viewer") {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div>
          <h2 className="text-xl font-bold text-white">Source Viewer &amp; Evidence Traceability</h2>
          <p className="text-sm text-[#52749B]">
            Select any claim to inspect its original source coordinate, confidence calibration, and text excerpt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#152338] border border-[#253A59] rounded-[12px] p-3 space-y-2 max-h-[540px] overflow-y-auto">
            <h3 className="text-xs font-semibold text-[#52749B] uppercase px-2 py-1">
              Claims ({claims.length})
            </h3>
            {claims.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedViewerClaim(c)}
                className={`w-full text-left p-3 rounded-[10px] text-xs transition border ${
                  selectedViewerClaim?.id === c.id
                    ? "border-[#3987F7] bg-[#1D3557] text-white"
                    : "border-[#253A59] bg-[#101B2D] hover:border-[#52749B] text-[#EAF2FC]/80"
                }`}
              >
                <div className="font-semibold text-white">
                  {c.entity} — {c.attribute}
                </div>
                <div className="font-mono text-[11px] text-[#52749B] mt-0.5">
                  {c.raw_value} {c.unit} | {c.source_filename}
                </div>
              </button>
            ))}
          </div>

          <div className="md:col-span-2 bg-[#152338] border border-[#253A59] rounded-[12px] p-6 space-y-5">
            {selectedViewerClaim ? (
              <>
                <div className="flex items-center justify-between border-b border-[#253A59] pb-4">
                  <div>
                    <span className="font-mono text-[11px] uppercase text-[#3987F7]">
                      Trace Verified
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {selectedViewerClaim.entity} : {selectedViewerClaim.attribute}
                    </h3>
                  </div>
                  <span className="px-3 py-1 bg-[#16B8A6]/15 border border-[#16B8A6]/40 text-[#16B8A6] font-mono text-xs font-semibold rounded-[8px]">
                    Confidence: {(selectedViewerClaim.extraction_confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-[#101B2D] p-4 rounded-[10px] border border-[#253A59]">
                  <div>
                    <span className="text-[#52749B] block mb-1">Source Document</span>
                    <strong className="font-mono text-white">{selectedViewerClaim.source_filename}</strong>
                  </div>
                  <div>
                    <span className="text-[#52749B] block mb-1">Location Coordinates</span>
                    <strong className="font-mono text-white">
                      {selectedViewerClaim.page_number ? `Page ${selectedViewerClaim.page_number}` : ""}
                      {selectedViewerClaim.row_number ? `Row ${selectedViewerClaim.row_number}` : ""}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#52749B] block mb-1">Extraction Method</span>
                    <strong className="font-mono uppercase text-[#3987F7]">
                      {selectedViewerClaim.extraction_method}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#52749B] block mb-1">Normalized Canonical SI</span>
                    <strong className="font-mono text-[#16B8A6]">
                      {selectedViewerClaim.normalized_value} {selectedViewerClaim.normalized_unit}
                    </strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs uppercase text-[#52749B] font-semibold block">
                    Original Document Excerpt
                  </span>
                  <div className="p-4 bg-[#101B2D] border border-[#253A59] rounded-[10px] font-mono text-xs leading-relaxed text-[#EAF2FC]">
                    &ldquo;{selectedViewerClaim.original_text}&rdquo;
                  </div>
                </div>

                <div className="border-t border-[#253A59] pt-3 flex items-center justify-between text-xs font-mono text-[#52749B]">
                  <span>
                    UTC:{" "}
                    {selectedViewerClaim.timestamp
                      ? new Date(selectedViewerClaim.timestamp).toUTCString()
                      : "Open Window"}
                  </span>
                  <span>ID: {selectedViewerClaim.id}</span>
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-sm text-[#52749B]">
                Select any claim from the list to inspect its provenance.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================== */
  /* 10. REVIEW HISTORY VIEW                                        */
  /* ============================================================== */
  if (activeTab === "reviews") {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div>
          <h2 className="text-xl font-bold text-white">Analyst Review &amp; Audit Trail</h2>
          <p className="text-sm text-[#52749B]">
            Immutable review history capturing human analyst conflict confirmations, corroborations, and dismissals.
          </p>
        </div>

        <div className="bg-[#152338] border border-[#253A59] rounded-[12px] overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#253A59] bg-[#101B2D] text-[#52749B] text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp (UTC)</th>
                <th className="py-3.5 px-4">Target Type</th>
                <th className="py-3.5 px-4">Resolution</th>
                <th className="py-3.5 px-4">Analyst</th>
                <th className="py-3.5 px-4">Justification Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#253A59]">
              {reviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-[#1D3557]/40 transition">
                  <td className="py-3.5 px-4 font-mono text-xs text-[#52749B]">
                    {new Date(rev.created_at).toUTCString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono uppercase text-xs font-semibold text-white">
                    {rev.target_type}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded font-mono text-xs font-semibold uppercase bg-[#3987F7]/20 text-[#3987F7]">
                      {rev.resolution}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#16B8A6]">{rev.analyst_id}</td>
                  <td className="py-3.5 px-4 text-xs text-[#EAF2FC]/85 leading-relaxed max-w-md">
                    {rev.analyst_note || "—"}
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-[#52749B]">
                    No reviews recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ============================================================== */
  /* 11. SYSTEM SETTINGS VIEW                                       */
  /* ============================================================== */
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-white">System Configuration &amp; Resilience</h2>
        <p className="text-sm text-[#52749B]">
          Circuit breaker states, rate limiting parameters, and conflict engine thresholds.
        </p>
      </div>

      <div className="bg-[#152338] border border-[#253A59] rounded-[12px] p-5 space-y-4">
        <h3 className="font-semibold text-sm text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#3987F7]" />
          <span>Circuit Breakers &amp; Service Health</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 border border-[#253A59] rounded-[10px] bg-[#101B2D]">
            <span className="text-[#52749B] block">OCR Engine Breaker</span>
            <span className="font-mono font-bold text-[#16B8A6] text-sm mt-1 block">
              {health?.circuit_breaker.ocr.state || "CLOSED"}
            </span>
            <p className="text-[#52749B] mt-1">Failure threshold: 5 | Recovery: 30s</p>
          </div>
          <div className="p-4 border border-[#253A59] rounded-[10px] bg-[#101B2D]">
            <span className="text-[#52749B] block">Embedding Engine Breaker</span>
            <span className="font-mono font-bold text-[#16B8A6] text-sm mt-1 block">
              {health?.circuit_breaker.embedding.state || "CLOSED"}
            </span>
            <p className="text-[#52749B] mt-1">Failure threshold: 5 | Fast-fail active</p>
          </div>
        </div>
      </div>

      <div className="bg-[#152338] border border-[#253A59] rounded-[12px] p-5 space-y-4">
        <h3 className="font-semibold text-sm text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#3987F7]" />
          <span>Conflict &amp; Intelligence Thresholds</span>
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-[#EAF2FC] uppercase mb-1.5">
              Numerical Equivalence Tolerance (%)
            </label>
            <input
              type="number"
              value={toleranceInput}
              onChange={(e) => setToleranceInput(e.target.value)}
              step="0.1"
              className="w-full bg-[#101B2D] border border-[#253A59] px-3.5 py-2 rounded-[10px] font-mono text-sm text-white focus:outline-none focus:border-[#3987F7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#EAF2FC] uppercase mb-1.5">
              Statistical Anomaly Z-Score Cutoff (σ)
            </label>
            <input
              type="number"
              value={zScoreInput}
              onChange={(e) => setZScoreInput(e.target.value)}
              step="0.1"
              className="w-full bg-[#101B2D] border border-[#253A59] px-3.5 py-2 rounded-[10px] font-mono text-sm text-white focus:outline-none focus:border-[#3987F7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#EAF2FC] uppercase mb-1.5">
              RapidFuzz Entity Resolution Threshold (%)
            </label>
            <input
              type="number"
              value={fuzzyInput}
              onChange={(e) => setFuzzyInput(e.target.value)}
              className="w-full bg-[#101B2D] border border-[#253A59] px-3.5 py-2 rounded-[10px] font-mono text-sm text-white focus:outline-none focus:border-[#3987F7]"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              onSaveSettings(
                `Saved thresholds (Tolerance ${toleranceInput}%, Z ≥ ${zScoreInput}σ, Fuzzy ${fuzzyInput}%).`
              )
            }
            className="px-4 py-2 bg-[#3987F7] hover:bg-[#2B76E5] text-white rounded-[10px] text-sm font-semibold transition"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
