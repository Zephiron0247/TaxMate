"use client";

import React, { useEffect, useState } from "react";
import { useMode } from "../context/ModeContext";
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Building2,
  Calendar
} from "lucide-react";

interface GSTRReportData {
  period: string;
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
  gstr1: {
    title: string;
    categories: Array<{
      category: string;
      count: number;
      taxable_value: number;
      gst_rate: number;
      total_gst: number;
      cgst: number;
      sgst: number;
      itc_eligible: boolean;
    }>;
    invoices: any[];
  };
  gstr3b: {
    title: string;
    table_4a_available: {
      title: string;
      taxable_value: number;
      cgst: number;
      sgst: number;
      total_itc: number;
    };
    table_4d_ineligible: {
      title: string;
      total_blocked_itc: number;
      reasons: string[];
    };
    net_itc_claimable: number;
  };
}

export default function GSTReportPage() {
  const { mode } = useMode();
  const [report, setReport] = useState<GSTRReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch("http://127.0.0.1:8000/reports/gst-summary");
        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error("Error fetching GST report:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;
    let csvContent = "data:text/csv;charset=utf-8,Category,Count,Taxable Value,GST Rate,CGST,SGST,Total GST,ITC Eligible\n";
    report.gstr1.categories.forEach((c) => {
      csvContent += `"${c.category}",${c.count},${c.taxable_value},${c.gst_rate}%,${c.cgst},${c.sgst},${c.total_gst},${c.itc_eligible ? "YES" : "NO (Sec 17(5))"}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TaxMate_GSTR_Summary_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !report) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading GSTR-1 & GSTR-3B summary calculations...
      </div>
    );
  }

  const { summary, gstr1, gstr3b } = report;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Export Actions */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Retailer GST Summary Report (CA Filing Review)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">GSTR-1 & GSTR-3B Tax Credit Schedule</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium border border-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print CA Report</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-500">Gross Purchases</div>
          <div className="text-xl font-bold text-slate-900">₹{summary.total_gross_spend.toLocaleString("en-IN")}</div>
          <div className="text-slate-500">Taxable Value: ₹{summary.total_taxable_value.toLocaleString("en-IN")}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-1">
          <div className="text-emerald-800 font-medium">Eligible ITC (Table 4.A)</div>
          <div className="text-xl font-bold text-emerald-900">₹{summary.eligible_itc.toLocaleString("en-IN")}</div>
          <div className="text-emerald-700">Claimable against output tax liability</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-amber-200 bg-amber-50/20 shadow-xs space-y-1">
          <div className="text-amber-800 font-medium">Ineligible ITC (Sec 17(5))</div>
          <div className="text-xl font-bold text-amber-900">₹{summary.blocked_itc.toLocaleString("en-IN")}</div>
          <div className="text-amber-700">Ineligible under Section 17(5)</div>
        </div>
      </div>

      {/* GSTR-3B Table 4 Section */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>GSTR-3B Table 4 (Input Tax Credit Summary)</span>
          </h2>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
            Format 3B.4
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Table 4.A Eligible */}
          <div className="p-4 bg-emerald-50/30 rounded-md border border-emerald-200/80 space-y-2">
            <h3 className="font-semibold text-emerald-900 text-xs">4(A) Input Tax Credit Available</h3>
            <div className="space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span>Total Taxable Value:</span>
                <span className="font-semibold">₹{gstr3b.table_4a_available.taxable_value.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Central Tax (CGST):</span>
                <span>₹{gstr3b.table_4a_available.cgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>State Tax (SGST):</span>
                <span>₹{gstr3b.table_4a_available.sgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-emerald-200 font-bold text-emerald-900">
                <span>Net Eligible ITC:</span>
                <span>₹{gstr3b.table_4a_available.total_itc.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Table 4.D Blocked */}
          <div className="p-4 bg-amber-50/30 rounded-md border border-amber-200/80 space-y-2">
            <h3 className="font-semibold text-amber-900 text-xs">4(D) Ineligible ITC under Section 17(5)</h3>
            <div className="space-y-1 text-slate-700">
              <div className="flex justify-between font-bold text-amber-900">
                <span>Total Blocked Credit:</span>
                <span>₹{gstr3b.table_4d_ineligible.total_blocked_itc.toLocaleString("en-IN")}</span>
              </div>
              <p className="text-[11px] text-slate-600 pt-1">
                Statutory reasons: Vehicle repair & maintenance (Sec 17(5)(a)), Food & beverages (Sec 17(5)(b)(i)), Personal consumption.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* GSTR-1 Inward Purchase Ledger by Category */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900 text-sm">GSTR-1 Inward Purchase Ledger (Category Breakdown)</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold">Count</th>
                <th className="p-3 font-semibold">GST Rate</th>
                <th className="p-3 font-semibold">Taxable Value</th>
                <th className="p-3 font-semibold">CGST (9%)</th>
                <th className="p-3 font-semibold">SGST (9%)</th>
                <th className="p-3 font-semibold">Total Tax</th>
                <th className="p-3 font-semibold">ITC Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gstr1.categories.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-medium text-slate-900">{c.category}</td>
                  <td className="p-3 text-slate-600">{c.count}</td>
                  <td className="p-3 text-slate-600">{c.gst_rate}%</td>
                  <td className="p-3 text-slate-900 font-mono">₹{c.taxable_value.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-slate-600 font-mono">₹{c.cgst.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-slate-600 font-mono">₹{c.sgst.toLocaleString("en-IN")}</td>
                  <td className="p-3 font-semibold text-slate-900 font-mono">₹{c.total_gst.toLocaleString("en-IN")}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                      c.itc_eligible
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}>
                      {c.itc_eligible ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-amber-600" />}
                      <span>{c.itc_eligible ? "Eligible" : "Blocked Sec 17(5)"}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
