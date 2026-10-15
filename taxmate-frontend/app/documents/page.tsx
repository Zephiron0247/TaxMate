"use client";

import React, { useEffect, useState } from "react";
import { 
  FileCheck2, 
  Plus, 
  Trash2, 
  Printer, 
  FileText, 
  Calendar, 
  User, 
  Hash, 
  CheckCircle2 
} from "lucide-react";

interface DocItem {
  description: string;
  quantity: number;
  unit_price: number;
  gst_rate: number;
}

interface DocumentRecord {
  id: number;
  doc_type: string;
  doc_number: string;
  party_name: string;
  date: string;
  total_amount: number;
  status: string;
  notes?: string;
  items: any[];
}

export default function DocumentCreationPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [docType, setDocType] = useState("purchase_order");
  const [partyName, setPartyName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DocItem[]>([
    { description: "Raw Material Input", quantity: 10, unit_price: 500, gst_rate: 18 }
  ]);
  const [activeDocView, setActiveDocView] = useState<DocumentRecord | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const res = await fetch("http://127.0.0.1:8000/documents");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (e) {
      console.error("Fetch docs error:", e);
    }
  }

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0, gst_rate: 18 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof DocItem, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  };

  const calculateTax = () => {
    return items.reduce((acc, item) => {
      const sub = item.quantity * item.unit_price;
      return acc + (sub * (item.gst_rate / 100));
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || items.length === 0) {
      alert("Please specify Party Name and at least one item.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: docType,
          party_name: partyName,
          date,
          notes,
          items
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPartyName("");
        setNotes("");
        setItems([{ description: "Raw Material Input", quantity: 10, unit_price: 500, gst_rate: 18 }]);
        fetchDocuments();
        setActiveDocView(data.document);
      }
    } catch (err) {
      console.error("Create doc error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Commercial Document Generator</h1>
        <p className="text-xs text-slate-600 mt-1">
          Create structured Purchase Orders, Quotations, Delivery Challans, Credit/Debit Notes, and Invoices with automatic GST taxation logic.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Document Generator Form */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileCheck2 className="w-4 h-4 text-teal-600" />
            <span>New Document Details</span>
          </h2>

          <form onSubmit={handleCreateDocument} className="space-y-4">
            {/* Document Type Selector */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 text-slate-900 font-medium"
              >
                <option value="purchase_order">Purchase Order (PO)</option>
                <option value="quotation">Quotation (QT)</option>
                <option value="delivery_challan">Delivery Challan (DC)</option>
                <option value="proforma_invoice">Proforma Invoice (PI)</option>
                <option value="credit_note">Credit Note (CN)</option>
                <option value="debit_note">Debit Note (DN)</option>
              </select>
            </div>

            {/* Party Name & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Vendor / Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Shree Metals Pvt Ltd"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Document Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-medium">Line Items</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Item Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                      required
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500">Qty</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Unit Price (₹)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">GST Rate %</span>
                      <select
                        value={item.gst_rate}
                        onChange={(e) => handleItemChange(idx, "gst_rate", Number(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-slate-900"
                      >
                        <option value={0}>0% (Exempt)</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Totals Box */}
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{calculateSubtotal().toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated GST:</span>
                <span>₹{calculateTax().toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                <span>Total Amount:</span>
                <span>₹{calculateTotal().toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">Notes / Terms</label>
              <textarea
                rows={2}
                placeholder="Payment terms, delivery instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              {saving ? "Generating Document..." : "Generate & Save Document"}
            </button>
          </form>
        </div>

        {/* Right Column: Issued Documents History */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Generated Documents Archive</span>
          </h2>

          <div className="space-y-3 max-h-128 overflow-y-auto">
            {documents.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                No documents generated yet. Create one using the form.
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setActiveDocView(doc)}
                  className={`p-3.5 rounded-md border cursor-pointer transition-colors ${
                    activeDocView?.id === doc.id
                      ? "border-teal-500 bg-teal-50/20"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{doc.doc_number}</span>
                    <span className="text-teal-700">₹{doc.total_amount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 text-[11px] mt-1">
                    <span>{doc.party_name}</span>
                    <span>{doc.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Document View & Print Modal */}
      {activeDocView && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-lg w-full shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">{activeDocView.doc_number}</h3>
              </div>
              <button
                onClick={() => setActiveDocView(null)}
                className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-md border border-slate-200">
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Document Type:</span>
                <span className="uppercase font-semibold">{activeDocView.doc_type.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Party / Merchant:</span>
                <span className="font-semibold text-slate-900">{activeDocView.party_name}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Date:</span>
                <span>{activeDocView.date}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1">
                <span className="font-medium text-slate-700">Items:</span>
                {activeDocView.items && activeDocView.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                    <span>{it.description} x{it.quantity} ({it.gst_rate}% GST)</span>
                    <span>₹{it.line_total ? it.line_total.toLocaleString("en-IN") : (it.quantity * it.unit_price)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-300 text-sm">
                <span>Total Amount:</span>
                <span>₹{activeDocView.total_amount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-semibold text-xs shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
