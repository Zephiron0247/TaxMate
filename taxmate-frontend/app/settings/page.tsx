"use client";

import React, { useState } from "react";
import { useMode } from "../context/ModeContext";
import { 
  Settings as SettingsIcon, 
  Eye, 
  Sliders, 
  ShieldCheck, 
  Cpu, 
  Save, 
  Building 
} from "lucide-react";

export default function SettingsPage() {
  const { mode, setMode } = useMode();
  const [businessName, setBusinessName] = useState("TaxMate Kirana & Retail");
  const [gstin, setGstin] = useState("27AAAAA0000A1Z5");
  const [stateCode, setStateCode] = useState("27 - Maharashtra");
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Application Settings & Business Profile</h1>
        <p className="text-xs text-slate-600 mt-1">
          Configure interface presentation depth, business tax information, and verify local AI model engine.
        </p>
      </div>

      {/* Interface Mode Preference Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-teal-600" />
          <span>Interface Tier Depth Preference</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setMode("simple")}
            className={`p-4 rounded-lg border cursor-pointer transition-all space-y-2 ${
              mode === "simple"
                ? "border-teal-500 bg-teal-50/20 ring-1 ring-teal-500"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-600" />
                <span>Simple Mode</span>
              </span>
              {mode === "simple" && <span className="text-[11px] px-2 py-0.5 rounded bg-teal-600 text-white font-medium">Active</span>}
            </div>
            <p className="text-slate-600 leading-relaxed">
              Designed for quick shopkeeper operations. Displays plain-language alerts, clear claimable ITC summaries, and hides technical IsolationForest vector scores.
            </p>
          </div>

          <div
            onClick={() => setMode("advanced")}
            className={`p-4 rounded-lg border cursor-pointer transition-all space-y-2 ${
              mode === "advanced"
                ? "border-slate-900 bg-slate-900 text-white ring-1 ring-slate-900"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between font-bold text-sm">
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-400" />
                <span className={mode === "advanced" ? "text-white" : "text-slate-900"}>Advanced Mode</span>
              </span>
              {mode === "advanced" && <span className="text-[11px] px-2 py-0.5 rounded bg-white text-slate-900 font-medium">Active</span>}
            </div>
            <p className={mode === "advanced" ? "text-slate-300 leading-relaxed" : "text-slate-600 leading-relaxed"}>
              Opt-in detailed mode showing exact raw IsolationForest decision scores (-0.42), SHAP feature attribution breakdowns, and line-item statutory HSN grids.
            </p>
          </div>
        </div>
      </div>

      {/* Business Tax Profile Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Building className="w-4 h-4 text-teal-600" />
          <span>GST Business Identity</span>
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Registered Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">GSTIN Number</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">State & Code</label>
              <input
                type="text"
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Business Profile</span>
            </button>
            {saved && <span className="text-emerald-700 font-semibold">Saved successfully!</span>}
          </div>
        </form>
      </div>

      {/* Local AI Offline Engine Status */}
      <div className="bg-slate-900 text-slate-200 p-5 rounded-lg border border-slate-800 shadow-xs space-y-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-white text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Local AI Privacy Engine Status</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-slate-800 rounded-md border border-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-teal-400">
              <Cpu className="w-4 h-4" />
              <span>Vision / OCR Model</span>
            </div>
            <p className="text-slate-300 text-[11px]">Ollama qwen3-vl:8b (Offline vision feature extraction)</p>
          </div>

          <div className="p-3 bg-slate-800 rounded-md border border-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-teal-400">
              <Cpu className="w-4 h-4" />
              <span>Text Structuring Model</span>
            </div>
            <p className="text-slate-300 text-[11px]">Ollama llama3.2:3b (Plain-language GST explanation phrasing)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
