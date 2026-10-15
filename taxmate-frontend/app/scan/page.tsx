"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  ScanLine, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  FileText, 
  Edit3,
  ShieldCheck,
  Cpu
} from "lucide-react";

export default function ScanReceiptPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable Form State
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Raw Materials");
  const [gstRate, setGstRate] = useState<number>(18.0);
  const [itcStatus, setItcStatus] = useState("Eligible");
  const [itcExplanation, setItcExplanation] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedData(null);
      setScanStatus(null);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return;

    setScanning(true);
    setScanStatus("Analyzing receipt with local Qwen3-VL:8b vision model...");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("http://127.0.0.1:8000/scan-receipt", {
        method: "POST",
        body: formData
      });

      const result = await res.json();
      setExtractedData(result);

      if (result.status === "needs_manual_review") {
        setScanStatus("Receipt scanned. Missing details flagged — please verify fields before saving.");
        const data = result.extracted_data || {};
        setVendor(data.vendor || "");
        setAmount(data.amount || "");
        setDate(data.date || new Date().toISOString().split("T")[0]);
        setCategory(data.category || "Raw Materials");
      } else {
        setScanStatus("Receipt read complete! Verify extracted values below.");
        const data = result.data || {};
        setVendor(data.vendor || "");
        setAmount(data.amount || "");
        setDate(data.date || new Date().toISOString().split("T")[0]);
        setCategory(data.category || "Raw Materials");
        setGstRate(data.gst_rate || 18.0);
        setItcStatus(data.itc_status || "Eligible");
        setItcExplanation(data.itc_explanation || "");
      }
    } catch (err) {
      console.error("OCR API error:", err);
      setScanStatus("Could not connect to local OCR model. Please enter fields manually.");
    } finally {
      setScanning(false);
    }
  };

  const handleCategoryChange = async (newCat: string) => {
    setCategory(newCat);
    try {
      const res = await fetch("http://127.0.0.1:8000/gst/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCat, amount: Number(amount) || 0, vendor })
      });
      const gstInfo = await res.json();
      setGstRate(gstInfo.gst_rate);
      setItcStatus(gstInfo.itc_status);
      setItcExplanation(gstInfo.explanation);
    } catch (e) {
      console.error("GST calculate error:", e);
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || !amount || !date) {
      alert("Please fill in Vendor, Amount, and Date before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor,
          amount: Number(amount),
          date,
          category,
          gst_rate: gstRate,
          itc_status: itcStatus,
          itc_explanation: itcExplanation,
          confidence_status: "verified"
        })
      });

      if (res.ok) {
        router.push("/ledger");
      } else {
        alert("Error saving transaction.");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save transaction.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Scan & Upload Paper Purchase Receipt</h1>
        <p className="text-xs text-slate-600 mt-1">
          Extract purchase details offline with Qwen3-VL vision AI. Fields are gated for your review before saving to the ledger.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: File Upload & Preview */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-teal-600" />
            <span>Select Receipt Image</span>
          </h2>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors bg-slate-50/50">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="receipt-file-input"
            />
            <label htmlFor="receipt-file-input" className="cursor-pointer space-y-2 block">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-medium text-slate-700">
                {selectedFile ? selectedFile.name : "Click or drag purchase receipt image here"}
              </div>
              <p className="text-[11px] text-slate-500">Supports JPG, PNG, WEBP (Processed 100% locally)</p>
            </label>
          </div>

          {previewUrl && (
            <div className="space-y-3">
              <div className="relative aspect-3/4 max-h-64 bg-slate-100 rounded-md overflow-hidden border border-slate-200">
                <img src={previewUrl} alt="Receipt preview" className="object-contain w-full h-full" />
              </div>

              <button
                onClick={handleScan}
                disabled={scanning}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                {scanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Reading receipt with local Qwen3-VL...</span>
                  </>
                ) : (
                  <>
                    <ScanLine className="w-4 h-4" />
                    <span>Run Local AI OCR Scan</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Animated Scanning Status Radar */}
          {scanning && (
            <div className="p-4 bg-teal-50/60 rounded-md border border-teal-200 text-xs text-teal-900 space-y-2 animate-pulse">
              <div className="flex items-center gap-2 font-medium">
                <Cpu className="w-4 h-4 text-teal-600 animate-spin" />
                <span>Ollama Qwen3-VL OCR Engine Active</span>
              </div>
              <p className="text-[11px] text-teal-700">{scanStatus}</p>
            </div>
          )}
        </div>

        {/* Right Column: Editable Confidence-Gated Form */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-teal-600" />
              <span>Extracted Purchase Fields (Review Required)</span>
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              Confidence-Gated
            </span>
          </div>

          <form onSubmit={handleSaveTransaction} className="space-y-4 text-xs">
            {/* Vendor Name */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">Vendor / Supplier Name</label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. National Traders"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                required
              />
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Total Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 text-slate-900 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">Purchase Category</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 text-slate-900"
              >
                <option value="Raw Materials">Raw Materials (18% Eligible)</option>
                <option value="Goods for Resale">Goods for Resale (18% Eligible)</option>
                <option value="Capital Goods">Capital Goods / Machinery (18% Eligible)</option>
                <option value="Office Supplies">Office Supplies / Stationery (12% Eligible)</option>
                <option value="Electronics/Computers">Electronics & IT Hardware (18% Eligible)</option>
                <option value="Freight/Transport">Freight & Transport (5% Eligible)</option>
                <option value="Commercial Rent">Commercial Rent (18% Eligible)</option>
                <option value="Professional Fees">Professional Services (18% Eligible)</option>
                <option value="Vehicle Maintenance">Vehicle Maintenance (18% Blocked Sec 17(5)(a))</option>
                <option value="Food & Beverages">Food & Catering (5% Blocked Sec 17(5)(b)(i))</option>
                <option value="Personal Expenses">Personal Consumption (18% Blocked Sec 17(5)(g))</option>
              </select>
            </div>

            {/* Auto-Evaluated GST & ITC Status Box */}
            <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Estimated GST Slab:</span>
                <span className="font-semibold text-slate-900">{gstRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">ITC Statutory Status:</span>
                <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  itcStatus.includes("Eligible") ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {itcStatus}
                </span>
              </div>
              {itcExplanation && (
                <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                  {itcExplanation}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Approve & Save to Ledger"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
