"use client";

import React from "react";
import Link from "next/link";
import { useMode } from "../context/ModeContext";
import { ScanLine, Sliders, Eye } from "lucide-react";

export const Header: React.FC = () => {
  const { mode, setMode } = useMode();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      {/* Title / Status */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Financial & GST Overview</h2>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
          FY 2026-27
        </span>
      </div>

      {/* Right Toolbar */}
      <div className="flex items-center gap-4">
        {/* Simple / Advanced Mode Toggle Switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setMode("simple")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === "simple"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            Simple Mode
          </button>

          <button
            onClick={() => setMode("advanced")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === "advanced"
                ? "bg-slate-900 text-white shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            Advanced Mode
          </button>
        </div>

        {/* Quick Action Button */}
        <Link
          href="/scan"
          className="flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-medium transition-colors shadow-xs"
        >
          <ScanLine className="w-4 h-4" />
          <span>Scan Receipt</span>
        </Link>
      </div>
    </header>
  );
};
