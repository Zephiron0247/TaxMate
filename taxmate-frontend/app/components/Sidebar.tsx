"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ScanLine, 
  ReceiptText, 
  FileSpreadsheet, 
  FileCheck2, 
  Settings,
  ShieldCheck,
  Cpu
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Scan Receipt", href: "/scan", icon: ScanLine },
  { name: "Transaction Ledger", href: "/ledger", icon: ReceiptText },
  { name: "GST & ITC Reports", href: "/gst-report", icon: FileSpreadsheet },
  { name: "Document Creation", href: "/documents", icon: FileCheck2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              T
            </div>
            <div>
              <h1 className="font-semibold text-slate-100 text-base leading-tight tracking-tight">TaxMate</h1>
              <p className="text-xs text-slate-400">Local AI Receipt Ledger</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-teal-400 border-l-2 border-teal-500 font-semibold"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-teal-400" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Local AI Offline Status Indicator */}
      <div className="p-4 m-3 rounded-lg bg-slate-800/80 border border-slate-700/60">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>100% Local & Offline AI</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span>Ollama Qwen3-VL & Llama3.2</span>
        </div>
      </div>
    </aside>
  );
};
