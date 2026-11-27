"use client";

import React from "react";
import {
  ShieldCheck,
  Network,
  GitCompare,
  Layers,
  Clock,
  FileSearch,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Database,
  Lock,
  Activity,
  ChevronRight,
  Upload,
  Cpu
} from "lucide-react";

interface LandingPageProps {
  onEnterDashboard: (targetTab?: string) => void;
  caseCount: number;
  claimCount: number;
  conflictCount: number;
}

export default function LandingPage({
  onEnterDashboard,
  caseCount,
  claimCount,
  conflictCount,
}: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#101B2D] font-sans flex flex-col">
      {/* TOP ENTERPRISE NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-[#FFFFFF]/95 backdrop-blur border-b border-[#E5EAF1]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#101B2D] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm border border-[#1D3557]">
              DF
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-base tracking-tight text-[#101B2D]">
                DATA FUSIONERS
              </span>
              <span className="text-[#E5EAF1]">|</span>
              <span className="font-semibold text-sm text-[#3987F7] tracking-tight">
                EvidenceLoom
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#52749B]">
            <a href="#capabilities" className="hover:text-[#101B2D] transition-colors">
              Capabilities
            </a>
            <a href="#workflow" className="hover:text-[#101B2D] transition-colors">
              Pipeline
            </a>
            <a href="#architecture" className="hover:text-[#101B2D] transition-colors">
              Architecture
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onEnterDashboard("workspace")}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-[#E5EAF1] bg-[#F7F9FC] text-[#101B2D] text-sm font-medium hover:bg-[#EAF2FC] hover:border-[#3987F7]/40 transition"
            >
              <Network className="w-4 h-4 text-[#3987F7]" />
              <span>Workspace</span>
            </button>
            <button
              onClick={() => onEnterDashboard("dashboard")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#3987F7] text-white text-sm font-semibold hover:bg-[#2B76E5] transition shadow-sm"
            >
              <span>Open Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION (Midnight Navy with Subtle Abstract Data-Network Visual) */}
      <section className="relative bg-[#101B2D] text-white overflow-hidden border-b border-[#1D3557]">
        {/* Subtle Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #52749B 1px, transparent 1px), linear-gradient(to bottom, #52749B 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D3557] border border-[#52749B]/40 text-xs font-medium text-[#EAF2FC]">
              <span className="w-2 h-2 rounded-full bg-[#16B8A6]" />
              <span>EvidenceLoom Intelligence Platform · Deterministic Verification</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.12] text-white">
              Multimodal Evidence Intelligence with{" "}
              <span className="text-[#3987F7]">Zero Fabricated Conclusions.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#EAF2FC]/80 leading-relaxed max-w-xl">
              Ingest PDFs, scanned gauges, spreadsheets, and telemetry logs into one unified graph. EvidenceLoom structures claims, aligns UTC timelines, normalizes physical units, and surfaces verifiable contradictions.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onEnterDashboard("workspace")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] bg-[#3987F7] hover:bg-[#2B76E5] text-white text-sm font-semibold transition shadow-sm"
              >
                <Network className="w-4 h-4" />
                <span>Launch Investigation Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEnterDashboard("dashboard")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] bg-[#1D3557] hover:bg-[#25426B] border border-[#52749B]/40 text-white text-sm font-semibold transition"
              >
                <Activity className="w-4 h-4 text-[#16B8A6]" />
                <span>View Analytics Dashboard</span>
              </button>
            </div>

            {/* Live Connected Workspace Snapshot (Real State Counts) */}
            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-[#1D3557] max-w-md">
              <div>
                <div className="font-mono text-xl font-bold text-white">{caseCount}</div>
                <div className="text-xs text-[#52749B] mt-0.5">Active Cases</div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-[#16B8A6]">{claimCount}</div>
                <div className="text-xs text-[#52749B] mt-0.5">Traced Claims</div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-[#E05252]">{conflictCount}</div>
                <div className="text-xs text-[#52749B] mt-0.5">Flagged Conflicts</div>
              </div>
            </div>
          </div>

          {/* Right Abstract Evidence Relationship Network Visual */}
          <div className="lg:col-span-6">
            <div className="rounded-[12px] bg-[#152338] border border-[#253A59] p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#253A59] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E05252]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E5A23B]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16B8A6]" />
                  <span className="ml-2 font-mono text-xs text-[#EAF2FC]/80">
                    evidenceloom://fusion-graph/case-active
                  </span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#16B8A6]/15 text-[#16B8A6] border border-[#16B8A6]/30">
                  PINT + UTC VERIFIED
                </span>
              </div>

              {/* Technical SVG Node-Link Topology */}
              <div className="bg-[#101B2D] rounded-[10px] border border-[#253A59] p-4">
                <svg viewBox="0 0 560 270" className="w-full h-auto">
                  {/* Connection Lines */}
                  <line x1="100" y1="65" x2="265" y2="65" stroke="#3987F7" strokeWidth="1.5" strokeDasharray="4 3" />
                  <line x1="100" y1="205" x2="265" y2="205" stroke="#3987F7" strokeWidth="1.5" strokeDasharray="4 3" />
                  <line x1="265" y1="65" x2="445" y2="65" stroke="#16B8A6" strokeWidth="2" />
                  <line x1="265" y1="205" x2="445" y2="205" stroke="#E05252" strokeWidth="2" />
                  <line x1="265" y1="65" x2="265" y2="205" stroke="#253A59" strokeWidth="1.5" />

                  {/* Left Source Nodes */}
                  <g>
                    <rect x="18" y="38" width="128" height="54" rx="10" fill="#1D3557" stroke="#3987F7" strokeWidth="1.2" />
                    <text x="32" y="60" fill="#EAF2FC" fontSize="11" fontWeight="600">Telemetry_Log.csv</text>
                    <text x="32" y="78" fill="#52749B" fontSize="10" fontFamily="monospace">ROW 14 · 95.0 °C</text>
                  </g>

                  <g>
                    <rect x="18" y="178" width="128" height="54" rx="10" fill="#1D3557" stroke="#3987F7" strokeWidth="1.2" />
                    <text x="32" y="200" fill="#EAF2FC" fontSize="11" fontWeight="600">Gauge_Scan.png</text>
                    <text x="32" y="218" fill="#52749B" fontSize="10" fontFamily="monospace">OCR · 95.0 °C</text>
                  </g>

                  {/* Center Entity Normalization Nodes */}
                  <g>
                    <rect x="205" y="38" width="128" height="54" rx="10" fill="#152338" stroke="#16B8A6" strokeWidth="1.5" />
                    <text x="219" y="60" fill="#FFFFFF" fontSize="11" fontWeight="600">Boiler 1 · Temp</text>
                    <text x="219" y="78" fill="#16B8A6" fontSize="10" fontFamily="monospace">203 °F ≡ 95.0 °C</text>
                  </g>

                  <g>
                    <rect x="205" y="178" width="128" height="54" rx="10" fill="#152338" stroke="#E05252" strokeWidth="1.5" />
                    <text x="219" y="200" fill="#FFFFFF" fontSize="11" fontWeight="600">Reactor α · Temp</text>
                    <text x="219" y="218" fill="#E05252" fontSize="10" fontFamily="monospace">95 °C vs 78 °C</text>
                  </g>

                  {/* Right Resolution Verdict Nodes */}
                  <g>
                    <rect x="392" y="38" width="150" height="54" rx="10" fill="#16B8A6" fillOpacity="0.14" stroke="#16B8A6" strokeWidth="1.5" />
                    <text x="406" y="60" fill="#16B8A6" fontSize="11" fontWeight="700">CORROBORATED</text>
                    <text x="406" y="78" fill="#EAF2FC" fontSize="10" fontFamily="monospace">Δ 0.00% · Verified</text>
                  </g>

                  <g>
                    <rect x="392" y="178" width="150" height="54" rx="10" fill="#E05252" fillOpacity="0.14" stroke="#E05252" strokeWidth="1.5" />
                    <text x="406" y="200" fill="#E05252" fontSize="11" fontWeight="700">CONFLICT FLAGGED</text>
                    <text x="406" y="218" fill="#EAF2FC" fontSize="10" fontFamily="monospace">Δ 17.89% · Review</text>
                  </g>
                </svg>
              </div>

              {/* Status Strip */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2 bg-[#101B2D] border border-[#253A59] rounded-[10px] px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16B8A6] shrink-0" />
                  <span className="text-[#EAF2FC] truncate">Unit Equivalence</span>
                </div>
                <div className="flex items-center gap-2 bg-[#101B2D] border border-[#253A59] rounded-[10px] px-3 py-2">
                  <AlertTriangle className="w-4 h-4 text-[#E05252] shrink-0" />
                  <span className="text-[#EAF2FC] truncate">Conflict Provenance</span>
                </div>
                <div className="flex items-center gap-2 bg-[#101B2D] border border-[#253A59] rounded-[10px] px-3 py-2">
                  <Clock className="w-4 h-4 text-[#3987F7] shrink-0" />
                  <span className="text-[#EAF2FC] truncate">UTC Alignment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES SECTION (Off-White & Pure White) */}
      <section id="capabilities" className="bg-[#F7F9FC] py-20 border-b border-[#E5EAF1]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#3987F7]">
              Platform Capabilities
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#101B2D]">
              Engineered for Deterministic Evidence Verification
            </h2>
            <p className="text-sm sm:text-base text-[#52749B] leading-relaxed">
              Built without opaque black-box hallucinations. Every extracted claim preserves its exact file hash, page or row index, extraction confidence, and raw excerpt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Lock,
                title: "Magic-Byte Security & Deduplication",
                desc: "Verifies binary file signatures against claimed extensions, detects zip bombs, sanitizes paths, and deduplicates via SHA-256.",
                tag: "Security Gate",
                color: "text-[#3987F7] bg-[#EAF2FC]",
              },
              {
                icon: Layers,
                title: "Multimodal Claim Structuring",
                desc: "Extracts entity, attribute, value, unit, and UTC timestamp tuples from PyMuPDF tables, OpenCV + Tesseract OCR scans, Excel, CSV, and logs.",
                tag: "Ingestion",
                color: "text-[#16B8A6] bg-[#16B8A6]/10",
              },
              {
                icon: GitCompare,
                title: "Layered Conflict Engine",
                desc: "Checks entity identity, attribute match, overlapping UTC windows, and Pint unit conversions before flagging contradictions.",
                tag: "Verification",
                color: "text-[#E05252] bg-[#E05252]/10",
              },
              {
                icon: Network,
                title: "NetworkX Evidence Topology",
                desc: "Connects investigations, documents, physical assets, and claims into an interactive provenance graph with status edges.",
                tag: "Topology",
                color: "text-[#3987F7] bg-[#EAF2FC]",
              },
              {
                icon: Activity,
                title: "Z-Score Statistical Anomalies",
                desc: "Flags measurements deviating significantly from group distributions as empirical outlier signals—never as automatic proof.",
                tag: "Analytics",
                color: "text-[#E5A23B] bg-[#E5A23B]/15",
              },
              {
                icon: ShieldCheck,
                title: "Circuit Breakers & DLQ Resilience",
                desc: "Applies token-bucket rate limiting, idempotency keys, exponential backoff retries, circuit breakers, and Dead Letter Queues.",
                tag: "Reliability",
                color: "text-[#1D3557] bg-[#E5EAF1]",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#FFFFFF] border border-[#E5EAF1] rounded-[12px] p-6 shadow-sm hover:border-[#3987F7]/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#52749B] font-medium">
                        {item.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[#101B2D]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#52749B] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* STEP-BY-STEP CONNECTED WORKFLOW SECTION (Pure White) */}
      <section id="workflow" className="bg-[#FFFFFF] py-20 border-b border-[#E5EAF1]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#3987F7]">
              End-to-End Pipeline
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#101B2D]">
              From Raw Multimodal Files to Auditable Decisions
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Secure Upload",
                detail: "Magic-byte validation, SHA-256 hash & idempotency check",
              },
              {
                step: "02",
                icon: FileSearch,
                title: "Extract & OCR",
                detail: "PyMuPDF, OpenCV + Tesseract, Pandas tabular parsing",
              },
              {
                step: "03",
                icon: Cpu,
                title: "Normalize",
                detail: "RapidFuzz entities, Pint SI units & strict UTC alignment",
              },
              {
                step: "04",
                icon: GitCompare,
                title: "Fuse & Detect",
                detail: "Corroboration, contradictions & Z-score outlier flags",
              },
              {
                step: "05",
                icon: CheckCircle2,
                title: "Analyst Review",
                detail: "3-panel workspace inspection & immutable audit trail",
              },
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative flex flex-col">
                  <div className="bg-[#F7F9FC] border border-[#E5EAF1] rounded-[12px] p-5 flex-1 space-y-3 hover:border-[#3987F7]/40 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#3987F7] bg-[#EAF2FC] px-2 py-0.5 rounded">
                        STEP {s.step}
                      </span>
                      <Icon className="w-4 h-4 text-[#1D3557]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#101B2D]">{s.title}</h3>
                    <p className="text-xs text-[#52749B] leading-relaxed">{s.detail}</p>
                  </div>
                  {idx < 4 && (
                    <div className="hidden md:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-[#E5EAF1] text-[#3987F7]">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ARCHITECTURE CALLOUT BAND (Deep Navy Blue) */}
      <section id="architecture" className="bg-[#1D3557] text-white py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#16B8A6]">
              <Database className="w-4 h-4" />
              <span>Local-First · PostgreSQL + pgvector Ready · OpenAPI Documented</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Inspect Every Finding in the Three-Panel Investigation Workspace
            </h2>
            <p className="text-sm text-[#EAF2FC]/80 leading-relaxed">
              Navigate uploaded evidence on the left, explore NetworkX claim relationships and timelines in the center, and verify exact page/row provenance on the right.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onEnterDashboard("workspace")}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] bg-[#3987F7] hover:bg-[#2B76E5] text-white text-sm font-semibold transition shadow-sm"
            >
              <span>Open Investigation Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEnterDashboard("upload")}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] bg-[#101B2D] hover:bg-[#152338] border border-[#52749B]/40 text-white text-sm font-semibold transition"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Evidence</span>
            </button>
          </div>
        </div>
      </section>

      {/* CLEAN FOOTER */}
      <footer className="bg-[#101B2D] text-[#EAF2FC]/70 border-t border-[#1D3557] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <span>DATA FUSIONERS</span>
              <span className="text-[#52749B]">|</span>
              <span className="text-[#3987F7]">EvidenceLoom</span>
            </div>
            <p className="text-xs text-[#52749B]">
              Enterprise Multimodal Evidence Intelligence &amp; Conflict Verification Platform
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-[#52749B]">
            <span>FastAPI + Pydantic</span>
            <span>PostgreSQL + pgvector</span>
            <span>Pint · RapidFuzz · NetworkX</span>
            <span>Next.js + Tailwind</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
