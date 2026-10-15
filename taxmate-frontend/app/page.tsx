"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useMode } from "./context/ModeContext";
import { 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  ScanLine, 
  ArrowUpRight,
  AlertTriangle,
  Info,
  Sparkles,
  Zap
} from "lucide-react";

interface Transaction {
  id: number;
  vendor: string;
  amount: number;
  date: string;
  category: string;
  gst_rate: number;
  itc_eligible: number;
  itc_status: string;
  itc_explanation?: string;
  is_anomaly: number;
  anomaly_score: number;
  anomaly_reason?: string;
  confidence_status: string;
}

interface GSTSummary {
  summary: {
    total_transactions: number;
    total_gross_spend: number;
    total_taxable_value: number;
    total_gst_paid: number;
    total_cgst: number;
    total_sgst: number;
    eligible_itc: number;
    blocked_itc: number;
    net_itc_claimable: number;
  };
}

export default function Dashboard() {
  const { mode } = useMode();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<GSTSummary["summary"] | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [learningStatus, setLearningStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [txRes, summaryRes, anomRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/transactions"),
          fetch("http://127.0.0.1:8000/reports/gst-summary"),
          fetch("http://127.0.0.1:8000/anomalies/detect")
        ]);

        const txData = await txRes.json();
        const sumData = await summaryRes.json();
        const anomData = await anomRes.json();

        setTransactions(txData.transactions || []);
        setSummary(sumData.summary || null);

        if (anomData.status === "insufficient_data") {
          setLearningStatus(anomData.message);
          setAnomalies([]);
        } else {
          setLearningStatus(null);
          setAnomalies((anomData.anomalies || []).filter((a: any) => a.is_anomaly));
        }
      } catch (err) {
        console.error("Error connecting to backend API:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {mode === "simple" ? "Good day, Retail Ledger Overview" : "Advanced Tax & Anomaly Analytics"}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {mode === "simple"
              ? "All receipts are verified locally. Plain-language insights and active GST tax credit status."
              : "Scikit-Learn IsolationForest + SHAP attributions running on local Ollama Qwen3-VL & Llama3.2 pipeline."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/scan"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan Purchase Receipt</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Purchases</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{summary ? summary.total_gross_spend.toLocaleString("en-IN") : "0"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary ? `${summary.total_transactions} receipts recorded` : "0 receipts"}
          </div>
        </div>

        {/* Net Eligible ITC */}
        <div className="bg-white p-4 rounded-lg border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-medium mb-1">
            <span>Claimable GST Tax Credit (ITC)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">
            ₹{summary ? summary.eligible_itc.toLocaleString("en-IN") : "0"}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            {mode === "simple" ? "Available for GSTR-3B tax offset" : `CGST: ₹${summary ? summary.total_cgst.toLocaleString("en-IN") : "0"} | SGST: ₹${summary ? summary.total_sgst.toLocaleString("en-IN") : "0"}`}
          </div>
        </div>

        {/* Blocked ITC under Sec 17(5) */}
        <div className="bg-white p-4 rounded-lg border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-medium mb-1">
            <span>Blocked Credit (Sec 17(5))</span>
            <XCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">
            ₹{summary ? summary.blocked_itc.toLocaleString("en-IN") : "0"}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">
            Ineligible per GST law (Vehicle/Food/Personal)
          </div>
        </div>

        {/* Active Anomalies */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Active Anomaly Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {anomalies.length}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 font-medium">
            {learningStatus ? learningStatus : `${anomalies.length} unusual receipts flagged`}
          </div>
        </div>
      </div>

      {/* Anomaly & Pattern Insights Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-900 text-sm">
              {mode === "simple" ? "Plain-Language Financial Alerts" : "IsolationForest & SHAP Anomaly Feature Attribution"}
            </h3>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
            {mode === "simple" ? "Simple Mode" : "SHAP TreeExplainer Active"}
          </span>
        </div>

        {learningStatus ? (
          <div className="p-4 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
            <Info className="w-5 h-5 text-slate-400 shrink-0" />
            <span>{learningStatus} — IsolationForest baseline activates automatically at 30 transactions.</span>
          </div>
        ) : anomalies.length === 0 ? (
          <div className="p-4 bg-emerald-50/40 rounded-md border border-emerald-200/60 text-xs text-emerald-800 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>No purchase anomalies detected. Your ledger patterns match typical historical vendor spend.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((anom) => (
              <div key={anom.transaction_id} className="p-4 rounded-md bg-rose-50/40 border border-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{anom.vendor} — ₹{anom.amount.toLocaleString("en-IN")}</span>
                    <span className="text-[11px] px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-normal">
                      {anom.category}
                    </span>
                  </div>
                  <p className="text-slate-700">
                    {mode === "simple"
                      ? `Alert: ${anom.explanation}`
                      : `IsolationForest Score: ${anom.anomaly_score} | SHAP Attribution: ${anom.explanation}`}
                  </p>
                </div>

                <Link
                  href="/ledger"
                  className="px-3 py-1.5 bg-white border border-rose-300 text-rose-800 hover:bg-rose-50 rounded text-xs font-medium self-start md:self-center transition-colors"
                >
                  Review in Ledger
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">Recent Purchase Transactions</h3>
          <Link href="/ledger" className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
            <span>View All Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Vendor</th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold">Amount</th>
                <th className="p-3 font-semibold">GST Rate</th>
                <th className="p-3 font-semibold">ITC Status</th>
                {mode === "advanced" && <th className="p-3 font-semibold">Anomaly Score</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 7).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono text-slate-600">{tx.date || "—"}</td>
                  <td className="p-3 font-medium text-slate-900">{tx.vendor}</td>
                  <td className="p-3 text-slate-600">{tx.category}</td>
                  <td className="p-3 font-semibold text-slate-900">₹{tx.amount.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-slate-600">{tx.gst_rate}%</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                      tx.itc_eligible
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}>
                      {tx.itc_eligible ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-amber-600" />}
                      <span>{tx.itc_status}</span>
                    </span>
                  </td>
                  {mode === "advanced" && (
                    <td className="p-3 font-mono text-slate-600">
                      {tx.is_anomaly ? (
                        <span className="text-rose-600 font-bold">{tx.anomaly_score} (Anomaly)</span>
                      ) : (
                        <span className="text-slate-400">{tx.anomaly_score || "Normal"}</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
