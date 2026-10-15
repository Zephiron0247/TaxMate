"use client";

import React, { useEffect, useState } from "react";
import { useMode } from "../context/ModeContext";
import { 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Edit2, 
  X,
  Save,
  FileSpreadsheet
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

export default function TransactionLedgerPage() {
  const { mode } = useMode();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [anomalyFilter, setAnomalyFilter] = useState("ALL");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Transaction Form State
  const [newVendor, setNewVendor] = useState("");
  const [newAmount, setNewAmount] = useState<number | "">("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newCategory, setNewCategory] = useState("Raw Materials");

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const res = await fetch("http://127.0.0.1:8000/transactions");
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (e) {
      console.error("Ledger fetch error:", e);
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor || !newAmount || !newDate) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor: newVendor,
          amount: Number(newAmount),
          date: newDate,
          category: newCategory
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewVendor("");
        setNewAmount("");
        fetchTransactions();
      }
    } catch (err) {
      console.error("Add transaction error:", err);
    }
  };

  const handleEditSave = async () => {
    if (!editingTx) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/transactions/${editingTx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor: editingTx.vendor,
          amount: Number(editingTx.amount),
          date: editingTx.date,
          category: editingTx.category
        })
      });

      if (res.ok) {
        setEditingTx(null);
        fetchTransactions();
      }
    } catch (err) {
      console.error("Edit transaction error:", err);
    }
  };

  const filtered = transactions.filter((tx) => {
    const matchesSearch = tx.vendor.toLowerCase().includes(search.toLowerCase()) || tx.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || tx.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesAnomaly = anomalyFilter === "ALL" || (anomalyFilter === "ANOMALY" && tx.is_anomaly) || (anomalyFilter === "NORMAL" && !tx.is_anomaly);
    return matchesSearch && matchesCategory && matchesAnomaly;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Purchase Transaction Ledger</h1>
          <p className="text-xs text-slate-600 mt-1">
            Complete searchable ledger of paper receipts and manual entries with automated GST slab lookups and anomaly tags.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Manual Transaction</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search vendor or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-md text-slate-900 bg-white"
            >
              <option value="ALL">All Categories</option>
              <option value="Raw Materials">Raw Materials</option>
              <option value="Goods for Resale">Goods for Resale</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Vehicle Maintenance">Vehicle Maintenance</option>
              <option value="Food & Beverages">Food & Beverages</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Status:</span>
            <select
              value={anomalyFilter}
              onChange={(e) => setAnomalyFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-md text-slate-900 bg-white"
            >
              <option value="ALL">All Items</option>
              <option value="ANOMALY">Flagged Anomalies Only</option>
              <option value="NORMAL">Normal Transactions Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-3 font-semibold">ID</th>
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Vendor</th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold">Amount</th>
                <th className="p-3 font-semibold">GST Rate</th>
                <th className="p-3 font-semibold">ITC Claim Status</th>
                <th className="p-3 font-semibold">Anomaly Check</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono text-slate-500">#{tx.id}</td>
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
                  <td className="p-3">
                    {tx.is_anomaly ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>{mode === "simple" ? "Unusual Spend" : `Score: ${tx.anomaly_score}`}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Normal</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setEditingTx(tx)}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 p-5 max-w-md w-full shadow-lg space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-sm">Edit Transaction #{editingTx.id}</h3>
              <button onClick={() => setEditingTx(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Vendor Name</label>
                <input
                  type="text"
                  value={editingTx.vendor}
                  onChange={(e) => setEditingTx({ ...editingTx, vendor: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={editingTx.amount}
                  onChange={(e) => setEditingTx({ ...editingTx, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={editingTx.date}
                  onChange={(e) => setEditingTx({ ...editingTx, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Category</label>
                <select
                  value={editingTx.category}
                  onChange={(e) => setEditingTx({ ...editingTx, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                >
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Goods for Resale">Goods for Resale</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Vehicle Maintenance">Vehicle Maintenance</option>
                  <option value="Food & Beverages">Food & Beverages</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingTx(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-3 py-1.5 bg-teal-600 text-white hover:bg-teal-700 rounded font-medium shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 p-5 max-w-md w-full shadow-lg space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-sm">Add Manual Transaction</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Laxmi Hardware"
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                >
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Goods for Resale">Goods for Resale</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Vehicle Maintenance">Vehicle Maintenance</option>
                  <option value="Food & Beverages">Food & Beverages</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-teal-600 text-white hover:bg-teal-700 rounded font-medium shadow-xs"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
