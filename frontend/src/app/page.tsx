"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Plus,
  Upload,
  FileText,
  Layers,
  AlertTriangle,
  Radio,
  Clock,
  GitBranch,
  Eye,
  FileCheck,
  Sliders,
  Network,
  Search,
  Bell,
  User,
  Menu,
  X,
  Home,
  CheckCircle2
} from "lucide-react";
import { api } from "@/lib/api";
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
import LandingPage from "@/components/LandingPage";
import InvestigationWorkspace from "@/components/InvestigationWorkspace";
import DashboardViews from "@/components/DashboardViews";
import { ProvenanceModal, NewCaseModal, ResolutionModal } from "@/components/Modals";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Executive Intelligence Dashboard",
  workspace: "Three-Panel Investigation Workspace",
  upload: "Multimodal Evidence Ingestion",
  explorer: "Evidence Explorer",
  claims: "Structured Claims & Provenance",
  conflicts: "Conflict & Corroboration Center",
  anomalies: "Statistical Anomaly Center",
  timeline: "Aligned UTC Timeline & Trends",
  graph: "Evidence Topology Graph",
  viewer: "Source Excerpt Viewer",
  reviews: "Analyst Review Audit History",
  settings: "System Resilience & Thresholds",
};

export default function DataFusionersApp() {
  // Primary Mode: 'landing' | 'console'
  const [activeTab, setActiveTab] = useState<string>("landing");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);

  // Core Data State
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [sources, setSources] = useState<Source[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  // Modal & Feedback State
  const [selectedClaimForViewer, setSelectedClaimForViewer] = useState<Claim | null>(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState<boolean>(false);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Resolution Modal State
  const [resolutionModalState, setResolutionModalState] = useState<{
    isOpen: boolean;
    targetType: "conflict" | "anomaly";
    targetId: string;
    targetLabel: string;
    defaultResolution: string;
  }>({
    isOpen: false,
    targetType: "conflict",
    targetId: "",
    targetLabel: "",
    defaultResolution: "confirmed_conflict",
  });

  // Upload State
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Search & Filters
  const [claimSearch, setClaimSearch] = useState<string>("");
  const [conflictFilter, setConflictFilter] = useState<string>("all");

  useEffect(() => {
    loadCases();
    loadHealth();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      loadCaseData(selectedCaseId);
    }
  }, [selectedCaseId]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function loadCases() {
    try {
      const data = await api.getCases();
      setCases(data);
      if (data.length > 0 && !selectedCaseId) {
        setSelectedCaseId(data[0].id);
      }
    } catch (err) {
      console.error("Error loading cases", err);
    }
  }

  async function loadHealth() {
    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch (err) {
      console.error("Error loading health", err);
    }
  }

  async function loadCaseData(caseId: string) {
    try {
      const [srcs, clms, cnfs, anoms, tl, gr, revs] = await Promise.all([
        api.getSources(caseId),
        api.getClaims(caseId),
        api.getConflicts(caseId),
        api.getAnomalies(caseId),
        api.getTimeline(caseId),
        api.getGraph(caseId),
        api.getReviews(caseId),
      ]);
      setSources(srcs);
      setClaims(clms);
      setConflicts(cnfs);
      setAnomalies(anoms);
      setTimeline(tl);
      setGraphData(gr);
      setReviews(revs);
    } catch (err) {
      console.error("Error loading case data", err);
    }
  }

  async function handleCreateCase(title: string, description: string) {
    const created = await api.createCase(title, description);
    setIsNewCaseModalOpen(false);
    await loadCases();
    setSelectedCaseId(created.id);
    setActiveTab("upload");
    showToast(`Created investigation "${created.title}".`);
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0 || !selectedCaseId) return;
    setIsUploading(true);
    setUploadProgress(20);
    setUploadMessage("Validating magic byte signatures and computing SHA-256...");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(40 + Math.round(((i + 1) / files.length) * 50));
        setUploadMessage(`Processing ${file.name} through multimodal router...`);
        await api.uploadFile(selectedCaseId, file);
      }
      setUploadProgress(100);
      setUploadMessage("Upload complete. Evidence ingested into claims pipeline.");
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(null);
        setUploadMessage(null);
        loadCaseData(selectedCaseId);
        showToast("Evidence ingested and processed.");
      }, 1000);
    } catch (err) {
      setIsUploading(false);
      setUploadMessage("Upload error: verify file signature and size limit (50MB).");
      showToast("Upload failed validation checks.");
    }
  }

  function openResolveConflictModal(conflict: Conflict, defaultResolution: string) {
    setResolutionModalState({
      isOpen: true,
      targetType: "conflict",
      targetId: conflict.id,
      targetLabel: `${conflict.entity} — ${conflict.attribute}`,
      defaultResolution,
    });
  }

  function openResolveAnomalyModal(anomaly: Anomaly, defaultResolution: string) {
    setResolutionModalState({
      isOpen: true,
      targetType: "anomaly",
      targetId: anomaly.id,
      targetLabel: `${anomaly.entity} — ${anomaly.attribute} (Z=${anomaly.z_score}σ)`,
      defaultResolution,
    });
  }

  async function submitResolution(resolution: string, note: string) {
    if (resolutionModalState.targetType === "conflict") {
      await api.resolveConflict(resolutionModalState.targetId, resolution, note);
    } else {
      await api.resolveAnomaly(resolutionModalState.targetId, resolution, note);
    }
    await loadCaseData(selectedCaseId);
    showToast("Audit resolution recorded.");
  }

  function openProvenanceViewer(claim: Claim) {
    setSelectedClaimForViewer(claim);
    setIsViewerModalOpen(true);
  }

  const currentCase = cases.find((c) => c.id === selectedCaseId) || cases[0];
  const activeConflictCount = conflicts.filter(
    (c) => c.conflict_type !== "corroboration" && c.status === "detected"
  ).length;
  const anomalyCount = anomalies.length;

  // Render Landing Page if activeTab === 'landing'
  if (activeTab === "landing") {
    return (
      <>
        <LandingPage
          onEnterDashboard={(targetTab) => setActiveTab(targetTab || "dashboard")}
          caseCount={cases.length}
          claimCount={claims.length}
          conflictCount={activeConflictCount}
        />
        <NewCaseModal
          isOpen={isNewCaseModalOpen}
          onClose={() => setIsNewCaseModalOpen(false)}
          onCreate={handleCreateCase}
        />
      </>
    );
  }

  const navGroups = [
    {
      group: "Platform",
      items: [
        { id: "landing", label: "Platform Overview", icon: Home },
        { id: "dashboard", label: "Dashboard", icon: Activity },
        { id: "workspace", label: "3-Panel Workspace", icon: Network },
      ],
    },
    {
      group: "Ingestion",
      items: [
        { id: "new-investigation", label: "New Investigation", icon: Plus },
        { id: "upload", label: "Evidence Upload", icon: Upload },
        { id: "explorer", label: "Evidence Explorer", icon: FileText },
      ],
    },
    {
      group: "Intelligence",
      items: [
        { id: "claims", label: "Structured Claims", icon: Layers },
        { id: "conflicts", label: "Conflict Center", icon: AlertTriangle, badge: activeConflictCount, badgeTone: "red" },
        { id: "anomalies", label: "Anomaly Center", icon: Radio, badge: anomalyCount, badgeTone: "amber" },
        { id: "timeline", label: "Timeline & Trends", icon: Clock },
        { id: "graph", label: "Evidence Graph", icon: GitBranch },
      ],
    },
    {
      group: "Traceability",
      items: [
        { id: "viewer", label: "Source Viewer", icon: Eye },
        { id: "reviews", label: "Review History", icon: FileCheck },
        { id: "settings", label: "System Settings", icon: Sliders },
      ],
    },
  ];

  const handleNavClick = (id: string) => {
    setMobileSidebarOpen(false);
    if (id === "new-investigation") {
      setIsNewCaseModalOpen(true);
    } else {
      setActiveTab(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#101B2D] text-white flex font-sans">
      {/* ============================================================== */}
      {/* LEFT ENTERPRISE SIDEBAR                                        */}
      {/* ============================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0C1524] border-r border-[#1D3557] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 px-5 border-b border-[#1D3557] flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveTab("landing")}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="w-8 h-8 rounded-[9px] bg-[#3987F7] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              DF
            </div>
            <div>
              <div className="text-xs font-bold tracking-wide text-white">DATA FUSIONERS</div>
              <div className="text-[11px] font-semibold text-[#3987F7]">EvidenceLoom</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1 text-[#52749B] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 text-[10px] font-semibold uppercase tracking-widest text-[#52749B]">
                {group.group}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[#3987F7]/15 text-white border border-[#3987F7]/40 font-semibold"
                        : "text-[#EAF2FC]/70 hover:text-white hover:bg-[#152338] border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-[#3987F7]" : "text-[#52749B]"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          item.badgeTone === "red"
                            ? "bg-[#E05252]/20 text-[#E05252]"
                            : "bg-[#E5A23B]/20 text-[#E5A23B]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Resilience Footer */}
        <div className="p-4 border-t border-[#1D3557] bg-[#101B2D]/60 space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-[#52749B]">Circuit Breaker</span>
            <span className="font-mono text-[#16B8A6] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16B8A6]" />
              {health?.circuit_breaker.ocr.state || "CLOSED"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#52749B]">API Quota</span>
            <span className="font-mono text-[#EAF2FC]">120 req/min</span>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN SHELL: TOPBAR + CONTENT                                   */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP NAVIGATION BAR */}
        <header className="h-16 bg-[#152338]/95 backdrop-blur border-b border-[#1D3557] sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-[8px] bg-[#101B2D] border border-[#253A59] text-[#EAF2FC]"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-white truncate">
                {PAGE_TITLES[activeTab] || "EvidenceLoom Console"}
              </h1>
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#52749B]">
                <span>Case:</span>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="bg-transparent text-[#EAF2FC] font-medium focus:outline-none cursor-pointer max-w-[240px] truncate"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#101B2D] text-white">
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Global Search, Notifications, New Case & Profile */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex relative">
              <Search className="w-3.5 h-3.5 text-[#52749B] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search claims or entities..."
                value={claimSearch}
                onChange={(e) => {
                  setClaimSearch(e.target.value);
                  if (activeTab !== "claims" && e.target.value.trim().length > 0) {
                    setActiveTab("claims");
                  }
                }}
                className="w-56 bg-[#101B2D] border border-[#253A59] rounded-[10px] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#52749B] focus:outline-none focus:border-[#3987F7]"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsNewCaseModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#3987F7] hover:bg-[#2B76E5] text-white text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Case</span>
            </button>

            {/* Notifications Button & Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((o) => !o)}
                className="p-2 rounded-[10px] bg-[#101B2D] border border-[#253A59] text-[#EAF2FC] hover:border-[#3987F7] transition relative"
                title="Findings & Pipeline Alerts"
              >
                <Bell className="w-4 h-4" />
                {(activeConflictCount > 0 || anomalyCount > 0) && (
                  <span className="w-2 h-2 rounded-full bg-[#E05252] absolute top-1.5 right-1.5" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#152338] border border-[#253A59] rounded-[12px] shadow-2xl p-3 space-y-2 z-50">
                  <div className="flex items-center justify-between text-xs font-semibold text-white border-b border-[#253A59] pb-2">
                    <span>Verification Alerts</span>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[#52749B] hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      setActiveTab("conflicts");
                    }}
                    className="w-full text-left p-2.5 rounded-[8px] bg-[#101B2D] hover:border-[#E05252] border border-[#253A59] text-xs"
                  >
                    <span className="font-semibold text-[#E05252] block">
                      {activeConflictCount} Active Conflict(s)
                    </span>
                    <span className="text-[#52749B]">Click to inspect in Conflict Center</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      setActiveTab("anomalies");
                    }}
                    className="w-full text-left p-2.5 rounded-[8px] bg-[#101B2D] hover:border-[#E5A23B] border border-[#253A59] text-xs"
                  >
                    <span className="font-semibold text-[#E5A23B] block">
                      {anomalyCount} Statistical Outlier(s)
                    </span>
                    <span className="text-[#52749B]">Z-score flags awaiting review</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#253A59]">
              <div className="w-8 h-8 rounded-full bg-[#1D3557] border border-[#3987F7]/40 flex items-center justify-center text-[#EAF2FC]">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold text-white">Lead Analyst</div>
                <div className="font-mono text-[10px] text-[#16B8A6]">UTC · Verified</div>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE / VIEW CONTENT */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1440px] w-full mx-auto">
          {activeTab === "workspace" ? (
            <InvestigationWorkspace
              sources={sources}
              claims={claims}
              conflicts={conflicts}
              anomalies={anomalies}
              timeline={timeline}
              graphData={graphData}
              onUploadFiles={handleFileUpload}
              onRequestResolveConflict={openResolveConflictModal}
              onRequestResolveAnomaly={openResolveAnomalyModal}
              onOpenModalProvenance={openProvenanceViewer}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          ) : (
            <DashboardViews
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentCase={currentCase}
              sources={sources}
              claims={claims}
              conflicts={conflicts}
              anomalies={anomalies}
              timeline={timeline}
              graphData={graphData}
              reviews={reviews}
              health={health}
              claimSearch={claimSearch}
              setClaimSearch={setClaimSearch}
              conflictFilter={conflictFilter}
              setConflictFilter={setConflictFilter}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              uploadMessage={uploadMessage}
              onRefresh={() => loadCaseData(selectedCaseId)}
              onUploadFiles={handleFileUpload}
              onOpenProvenance={openProvenanceViewer}
              onRequestResolveConflict={openResolveConflictModal}
              onRequestResolveAnomaly={openResolveAnomalyModal}
              onSaveSettings={showToast}
            />
          )}
        </main>
      </div>

      {/* MODALS & TOAST */}
      <ProvenanceModal
        claim={selectedClaimForViewer}
        isOpen={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
      />

      <NewCaseModal
        isOpen={isNewCaseModalOpen}
        onClose={() => setIsNewCaseModalOpen(false)}
        onCreate={handleCreateCase}
      />

      <ResolutionModal
        isOpen={resolutionModalState.isOpen}
        targetType={resolutionModalState.targetType}
        targetLabel={resolutionModalState.targetLabel}
        defaultResolution={resolutionModalState.defaultResolution}
        onClose={() => setResolutionModalState((s) => ({ ...s, isOpen: false }))}
        onSubmit={submitResolution}
      />

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#152338] border border-[#16B8A6] text-white px-4 py-3 rounded-[10px] shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#16B8A6] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
