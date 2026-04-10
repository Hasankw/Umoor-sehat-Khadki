"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

type Category = "ortho" | "examination" | "physio" | "dental" | "other";

type QueuePatient = {
  patient_id: string;
  patient_name: string;
  token_number: number;
  done: boolean;
};

type QueueMap = Record<Category, QueuePatient[]>;

const CATEGORIES: { key: Category; label: string; color: string; bg: string }[] = [
  { key: "ortho",       label: "Ortho",       color: "#1e40af", bg: "#eff6ff" },
  { key: "examination", label: "Examination", color: "#7c3aed", bg: "#f5f3ff" },
  { key: "physio",      label: "Physio",      color: "#065f46", bg: "#ecfdf5" },
  { key: "dental",      label: "Dental",      color: "#9f1239", bg: "#fff1f2" },
  { key: "other",       label: "Other",       color: "#374151", bg: "#f9fafb" },
];

export default function QueueBoard({ initialPatients }: {
  initialPatients: {
    id: string;
    name: string;
    sehat_medical_records: {
      token_ortho: boolean; token_ortho_number: number | null; ortho_done: boolean;
      token_examination: boolean; token_examination_number: number | null; examination_done: boolean;
      token_physio: boolean; token_physio_number: number | null; physio_done: boolean;
      token_dental: boolean; token_dental_number: number | null; dental_done: boolean;
      token_other: boolean; token_other_number: number | null; other_done: boolean;
    }[];
  }[];
}) {
  const buildQueue = useCallback((patients: typeof initialPatients): QueueMap => {
    const map: QueueMap = { ortho: [], examination: [], physio: [], dental: [], other: [] };
    for (const p of patients) {
      const rec = p.sehat_medical_records[0];
      if (!rec) continue;
      const cats: Category[] = ["ortho", "examination", "physio", "dental", "other"];
      for (const cat of cats) {
        const tokenKey  = `token_${cat}` as keyof typeof rec;
        const numKey    = `token_${cat}_number` as keyof typeof rec;
        const doneKey   = `${cat}_done` as keyof typeof rec;
        if (rec[tokenKey]) {
          map[cat].push({
            patient_id:   p.id,
            patient_name: p.name,
            token_number: (rec[numKey] as number) ?? 0,
            done:         (rec[doneKey] as boolean) ?? false,
          });
        }
      }
    }
    // Sort by token number
    for (const cat of Object.keys(map) as Category[]) {
      map[cat].sort((a, b) => a.token_number - b.token_number);
    }
    return map;
  }, []);

  const router = useRouter();
  const [queue, setQueue]         = useState<QueueMap>(() => buildQueue(initialPatients));
  const [toggling, setToggling]   = useState<Set<string>>(new Set());
  const [resetting, setResetting] = useState<"tokens" | "queue" | null>(null);

  async function handleReset(type: "tokens" | "queue") {
    const label = type === "tokens" ? "token counters" : "queue board";
    if (!confirm(`Reset all ${label}? This cannot be undone.`)) return;
    setResetting(type);
    try {
      const res = await fetch("/api/sehat/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) { alert("Reset failed"); return; }
      if (type === "queue") {
        // Clear all done flags locally
        setQueue((prev) => {
          const next = { ...prev } as QueueMap;
          for (const cat of Object.keys(next) as Category[]) {
            next[cat] = next[cat].map((p) => ({ ...p, done: false }));
          }
          return next;
        });
      } else {
        // Refresh page to update token counter display
        router.refresh();
      }
    } finally {
      setResetting(null);
    }
  }

  // Auto-refresh every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/sehat/patients");
        if (!res.ok) return;
        const data = await res.json();
        setQueue(buildQueue(data));
      } catch { /* silent */ }
    }, 10000);
    return () => clearInterval(interval);
  }, [buildQueue]);

  async function toggleDone(patientId: string, category: Category, current: boolean) {
    const key = `${patientId}-${category}`;
    setToggling((prev) => new Set(prev).add(key));

    // Optimistic update
    setQueue((prev) => ({
      ...prev,
      [category]: prev[category].map((p) =>
        p.patient_id === patientId ? { ...p, done: !current } : p
      ),
    }));

    try {
      await fetch(`/api/sehat/patients/${patientId}/done`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, done: !current }),
      });
    } catch {
      // Revert on error
      setQueue((prev) => ({
        ...prev,
        [category]: prev[category].map((p) =>
          p.patient_id === patientId ? { ...p, done: current } : p
        ),
      }));
    } finally {
      setToggling((prev) => { const s = new Set(prev); s.delete(key); return s; });
    }
  }

  const totalActive   = Object.values(queue).flat().length;
  const totalDone     = Object.values(queue).flat().filter((p) => p.done).length;

  return (
    <div className="mt-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-heading font-bold text-lg" style={{ color: "var(--color-navy)" }}>
            Live Queue Board
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalDone} / {totalActive} completed · auto-refreshes every 10s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full font-medium"
            style={{ background: "rgba(207,155,0,0.12)", color: "var(--color-gold)" }}>
            LIVE
          </span>
          {/* Reset queue */}
          <button
            onClick={() => handleReset("queue")}
            disabled={resetting !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-orange-50 disabled:opacity-50"
            style={{ borderColor: "#fed7aa", color: "#c2410c" }}
            title="Clear all done checkmarks"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {resetting === "queue" ? "Resetting…" : "Reset Queue"}
          </button>
          {/* Reset tokens */}
          <button
            onClick={() => handleReset("tokens")}
            disabled={resetting !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-red-50 disabled:opacity-50"
            style={{ borderColor: "#fecaca", color: "#dc2626" }}
            title="Reset all token numbers to 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {resetting === "tokens" ? "Resetting…" : "Reset Tokens"}
          </button>
        </div>
      </div>

      {/* 5 category columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {CATEGORIES.map(({ key, label, color, bg }) => {
          const patients = queue[key];
          const doneCount = patients.filter((p) => p.done).length;
          return (
            <div key={key} className="rounded-2xl border overflow-hidden"
              style={{ borderColor: `${color}22` }}>
              {/* Column header */}
              <div className="px-3 py-2.5 flex items-center justify-between"
                style={{ background: bg }}>
                <span className="font-heading font-bold text-sm" style={{ color }}>{label}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${color}18`, color }}>
                  {doneCount}/{patients.length}
                </span>
              </div>

              {/* Patient list */}
              <div className="bg-white divide-y divide-gray-100" style={{ minHeight: 80 }}>
                {patients.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center py-6">No patients yet</p>
                ) : (
                  patients.map((p) => {
                    const togKey = `${p.patient_id}-${key}`;
                    const isToggling = toggling.has(togKey);
                    return (
                      <button
                        key={p.patient_id}
                        onClick={() => toggleDone(p.patient_id, key, p.done)}
                        disabled={isToggling}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                      >
                        {/* Token badge */}
                        <span className="text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={p.done
                            ? { background: "#dcfce7", color: "#16a34a" }
                            : { background: bg, color }}>
                          {p.token_number}
                        </span>

                        {/* Name */}
                        <span className={`text-[12px] flex-1 text-left ${p.done ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}>
                          {p.patient_name}
                        </span>

                        {/* Done indicator */}
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          p.done ? "border-transparent bg-green-500" : "border-gray-300"
                        }`}>
                          {p.done && (
                            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5">
                              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                            </svg>
                          )}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
