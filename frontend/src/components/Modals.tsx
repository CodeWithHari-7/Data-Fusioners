"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { Claim } from "@/types";

interface ProvenanceModalProps {
  claim: Claim | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProvenanceModal({ claim, isOpen, onClose }: ProvenanceModalProps) {
  if (!isOpen || !claim) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#070D17]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#152338] border border-[#253A59] rounded-[12px] max-w-2xl w-full p-6 shadow-2xl space-y-5 text-white">
        <div className="flex items-center justify-between border-b border-[#253A59] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#3987F7]/15 border border-[#3987F7]/40 flex items-center justify-center text-[#3987F7]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Claim Provenance &amp; Source Excerpt
              </h3>
              <p className="font-mono text-[11px] text-[#52749B]">
                CLAIM_ID: {claim.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[#52749B] hover:text-white hover:bg-[#1D3557] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs bg-[#101B2D] p-4 rounded-[10px] border border-[#253A59]">
          <div>
            <span className="text-[#52749B] block mb-0.5">Entity</span>
            <strong className="text-white text-sm font-semibold">{claim.entity}</strong>
          </div>
          <div>
            <span className="text-[#52749B] block mb-0.5">Attribute</span>
            <strong className="text-white text-sm font-semibold">{claim.attribute}</strong>
          </div>
          <div>
            <span className="text-[#52749B] block mb-0.5">Extracted / Normalized</span>
            <strong className="font-mono text-[#16B8A6]">
              {claim.raw_value} {claim.unit || ""}
              {claim.normalized_value !== undefined && claim.normalized_value !== null
                ? ` → ${claim.normalized_value} ${claim.normalized_unit || ""}`
                : ""}
            </strong>
          </div>
          <div>
            <span className="text-[#52749B] block mb-0.5">Source Coordinate</span>
            <strong className="font-mono text-[#EAF2FC]">
              {claim.source_filename || "Document"}
              {claim.page_number ? ` · p.${claim.page_number}` : ""}
              {claim.row_number ? ` · row ${claim.row_number}` : ""}
            </strong>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#52749B] font-semibold block">
            Original Evidence Excerpt
          </span>
          <div className="p-4 bg-[#101B2D] border border-[#253A59] rounded-[10px] text-[#EAF2FC] font-mono text-xs leading-relaxed">
            &ldquo;{claim.original_text}&rdquo;
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#52749B] pt-3 border-t border-[#253A59]">
          <span>
            Method:{" "}
            <strong className="font-mono uppercase text-[#EAF2FC]">
              {claim.extraction_method}
            </strong>
          </span>
          <span>
            Calibrated Confidence:{" "}
            <strong className="font-mono text-[#16B8A6]">
              {(claim.extraction_confidence * 100).toFixed(0)}%
            </strong>
          </span>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#3987F7] hover:bg-[#2B76E5] text-white rounded-[10px] text-sm font-semibold transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string) => Promise<void>;
}

export function NewCaseModal({ isOpen, onClose, onCreate }: NewCaseModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onCreate(title.trim(), description.trim());
      setTitle("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#070D17]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <form
        onSubmit={handleSubmit}
        className="bg-[#152338] border border-[#253A59] rounded-[12px] max-w-md w-full p-6 shadow-2xl space-y-5 text-white"
      >
        <div className="flex items-center justify-between border-b border-[#253A59] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#3987F7]/15 border border-[#3987F7]/40 flex items-center justify-center text-[#3987F7]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">New Investigation Case</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[#52749B] hover:text-white hover:bg-[#1D3557] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#EAF2FC] uppercase tracking-wider mb-1.5">
              Investigation Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Substation Battery Health Audit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#101B2D] border border-[#253A59] px-3.5 py-2.5 rounded-[10px] text-sm text-white placeholder-[#52749B] focus:outline-none focus:ring-2 focus:ring-[#3987F7]/40 focus:border-[#3987F7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#EAF2FC] uppercase tracking-wider mb-1.5">
              Scope &amp; Objective
            </label>
            <textarea
              rows={3}
              placeholder="Detail target equipment, telemetry sources, or anomaly scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#101B2D] border border-[#253A59] px-3.5 py-2.5 rounded-[10px] text-sm text-white placeholder-[#52749B] focus:outline-none focus:ring-2 focus:ring-[#3987F7]/40 focus:border-[#3987F7]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#253A59]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#253A59] bg-[#101B2D] text-[#EAF2FC] rounded-[10px] text-sm font-medium hover:bg-[#1D3557] transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-[#3987F7] hover:bg-[#2B76E5] disabled:opacity-60 text-white rounded-[10px] text-sm font-semibold transition"
          >
            {submitting ? "Creating..." : "Create Investigation"}
          </button>
        </div>
      </form>
    </div>
  );
}

interface ResolutionModalProps {
  isOpen: boolean;
  targetType: "conflict" | "anomaly";
  targetLabel: string;
  defaultResolution: string;
  onClose: () => void;
  onSubmit: (resolution: string, note: string) => Promise<void>;
}

export function ResolutionModal({
  isOpen,
  targetType,
  targetLabel,
  defaultResolution,
  onClose,
  onSubmit,
}: ResolutionModalProps) {
  const [resolution, setResolution] = useState(defaultResolution);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setResolution(defaultResolution);
    setNote("");
  }, [defaultResolution, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(resolution, note);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#070D17]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <form
        onSubmit={handleSubmit}
        className="bg-[#152338] border border-[#253A59] rounded-[12px] max-w-md w-full p-6 shadow-2xl space-y-4 text-white"
      >
        <div className="flex items-center justify-between border-b border-[#253A59] pb-3">
          <div className="flex items-center gap-2">
            {resolution === "confirmed_conflict" ? (
              <AlertTriangle className="w-5 h-5 text-[#E05252]" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#16B8A6]" />
            )}
            <h3 className="text-base font-semibold">
              Record Analyst {targetType === "conflict" ? "Conflict" : "Anomaly"} Review
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#52749B] hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#EAF2FC]/80 font-mono bg-[#101B2D] p-2.5 rounded-[8px] border border-[#253A59]">
          Target: {targetLabel}
        </p>

        <div>
          <label className="block text-xs font-semibold text-[#EAF2FC] uppercase tracking-wider mb-1.5">
            Resolution Decision
          </label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="w-full bg-[#101B2D] border border-[#253A59] px-3 py-2 rounded-[10px] text-sm text-white focus:outline-none focus:border-[#3987F7]"
          >
            <option value="confirmed_conflict">Confirmed Conflict / Defect</option>
            <option value="corroborated">Verified / Corroborated</option>
            <option value="false_positive">False Positive</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#EAF2FC] uppercase tracking-wider mb-1.5">
            Analyst Justification Note
          </label>
          <textarea
            rows={3}
            required
            placeholder="Document physical cause, calibration offset, or corroborating source..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-[#101B2D] border border-[#253A59] px-3 py-2 rounded-[10px] text-sm text-white placeholder-[#52749B] focus:outline-none focus:border-[#3987F7]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#253A59]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-[10px] bg-[#101B2D] border border-[#253A59] text-sm text-[#EAF2FC] hover:bg-[#1D3557]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-[10px] bg-[#3987F7] hover:bg-[#2B76E5] text-white text-sm font-semibold"
          >
            {saving ? "Recording..." : "Save Audit Decision"}
          </button>
        </div>
      </form>
    </div>
  );
}
