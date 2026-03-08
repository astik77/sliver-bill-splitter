"use client";

import { useState, useRef } from "react";
import { Upload, Users, Plus, X, Calculator, ReceiptText, ChevronRight } from "lucide-react";

interface Item {
  name: string;
  qty: number;
  price: number;
}

export default function Home() {
  const [people, setPeople] = useState<string[]>(["Alice", "Bob"]);
  const [newPerson, setNewPerson] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [total, setTotal] = useState(0);
  const [assignments, setAssignments] = useState<Record<number, string[]>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      scanReceipt(file);
    }
  };

  const scanReceipt = async (file: File) => {
    setIsScanning(true);
    try {
      const base64Image = await fileToBase64(file);
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image, mimeType: file.type })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(data.items || []);
      setCurrency(data.currency || "USD");
      setTotal(data.total || 0);
      setAssignments({});
      setShowSummary(false);
    } catch (e) {
      console.error(e);
      alert("Failed to scan receipt");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addPerson = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newPerson.trim();
    if (trimmed && !people.includes(trimmed)) {
      setPeople([...people, trimmed]);
      setNewPerson("");
    }
  };

  const removePerson = (person: string) => {
    setPeople(people.filter((p) => p !== person));
    const newAssignments = { ...assignments };
    Object.keys(newAssignments).forEach((key) => {
      const idx = Number(key);
      newAssignments[idx] = newAssignments[idx].filter((p) => p !== person);
    });
    setAssignments(newAssignments);
  };

  const toggleAssignment = (itemIndex: number, person: string) => {
    const current = assignments[itemIndex] || [];
    if (current.includes(person)) {
      setAssignments({ ...assignments, [itemIndex]: current.filter((p) => p !== person) });
    } else {
      setAssignments({ ...assignments, [itemIndex]: [...current, person] });
    }
  };

  const calculateSplits = () => {
    const totals: Record<string, number> = {};
    people.forEach((p) => (totals[p] = 0));
    let unassigned = 0;

    items.forEach((item, idx) => {
      const assigned = assignments[idx] || [];
      const itemTotal = item.price * item.qty;
      if (assigned.length > 0) {
        const share = itemTotal / assigned.length;
        assigned.forEach((p) => {
          if (totals[p] !== undefined) totals[p] += share;
        });
      } else {
        unassigned += itemTotal;
      }
    });
    return { totals, unassigned };
  };

  const { totals, unassigned } = calculateSplits();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500/30">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <ReceiptText className="w-5 h-5 text-neutral-950" />
            </div>
            <span className="font-bold text-xl tracking-tight">Sliver</span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="flex items-center gap-2 bg-white text-neutral-950 px-4 py-2 rounded-full font-medium text-sm hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isScanning ? (
              <div className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isScanning ? "Scanning..." : "Upload Receipt"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-24 pb-32 space-y-8">
        {/* PEOPLE BENCH */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-neutral-400">
            <Users className="w-5 h-5" />
            <h2 className="font-medium">The Squad</h2>
          </div>
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl">
            <form onSubmit={addPerson} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                placeholder="Add a person..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors placeholder:text-neutral-600"
              />
              <button
                type="submit"
                className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 rounded-xl transition-colors flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {people.map((p) => (
                <div
                  key={p}
                  className="flex items-center gap-2 bg-neutral-800 rounded-full pl-4 pr-1.5 py-1.5 text-sm font-medium animate-in fade-in zoom-in duration-200"
                >
                  {p}
                  <button
                    onClick={() => removePerson(p)}
                    className="p-1 hover:bg-neutral-700 rounded-full transition-colors text-neutral-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {people.length === 0 && (
                <p className="text-neutral-500 text-sm py-2">Add people to start splitting.</p>
              )}
            </div>
          </div>
        </section>

        {/* ITEM LIST */}
        {items.length > 0 && (
          <section className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="flex items-center justify-between text-neutral-400">
              <h2 className="font-medium">Receipt Items</h2>
              <span className="text-sm font-mono">{currency} {total.toFixed(2)}</span>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-lg space-y-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      <div className="bg-neutral-800 px-2 py-1 rounded text-sm font-mono h-fit">
                        {item.qty}x
                      </div>
                      <div>
                        <p className="font-medium text-lg leading-tight">{item.name}</p>
                        <p className="text-neutral-500 text-sm mt-0.5 font-mono">
                          {currency} {item.price.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                    <div className="font-mono font-medium text-lg">
                      {currency} {(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex flex-wrap gap-2">
                    {people.map((p) => {
                      const isAssigned = (assignments[idx] || []).includes(p);
                      return (
                        <button
                          key={p}
                          onClick={() => toggleAssignment(idx, p)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${isAssigned
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50"
                            : "bg-neutral-800 text-neutral-400 border border-transparent hover:bg-neutral-700"
                            }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      {items.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <button
              onClick={() => setShowSummary(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Calculator className="w-5 h-5" />
              Calculate Split
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY MODAL */}
      {showSummary && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <div className="bg-neutral-900 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl border border-neutral-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
              <h2 className="text-xl font-bold">Split Summary</h2>
              <button
                onClick={() => setShowSummary(false)}
                className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {Object.entries(totals).map(([person, amount]) => (
                <div key={person} className="flex justify-between items-center p-4 bg-neutral-800/50 rounded-2xl">
                  <div className="font-medium text-lg">{person}</div>
                  <div className="font-mono text-xl text-emerald-400 font-bold">
                    {currency} {amount.toFixed(2)}
                  </div>
                </div>
              ))}

              {unassigned > 0 && (
                <div className="flex justify-between items-center p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl mt-4">
                  <div className="font-medium">Unassigned Items</div>
                  <div className="font-mono font-bold">
                    {currency} {unassigned.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-neutral-950 flex justify-between items-center border-t border-neutral-800">
              <span className="text-neutral-400">Total Accounted</span>
              <span className="font-mono text-xl font-bold">
                {currency} {(total - unassigned).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
