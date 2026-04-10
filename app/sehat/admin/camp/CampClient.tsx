"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PatientRow, CounterRow } from "./page";
import { UserPlus, Trash2, FileText, ChevronRight } from "lucide-react";

const CATEGORIES = [
  { key: "ortho",       label: "Ortho" },
  { key: "examination", label: "Examination" },
  { key: "physio",      label: "Physio" },
  { key: "dental",      label: "Dental" },
  { key: "other",       label: "Other" },
] as const;

type TokenKey = typeof CATEGORIES[number]["key"];

type TokenState = Record<TokenKey, boolean> & { other_label: string };

const defaultTokens = (): TokenState => ({
  ortho: false, examination: false, physio: false, dental: false, other: false, other_label: "",
});

export default function CampClient({
  patients,
  counters,
}: {
  patients: PatientRow[];
  counters: CounterRow[];
}) {
  const router = useRouter();

  const [showForm, setShowForm]   = useState(false);
  const [step, setStep]           = useState<1 | 2>(1);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  // Step 1 fields
  const [name, setName]       = useState("");
  const [its, setIts]         = useState("");
  const [age, setAge]         = useState("");
  const [contact, setContact] = useState("");

  // Step 2 tokens
  const [tokens, setTokens] = useState<TokenState>(defaultTokens());

  const counterMap: Record<string, number> = {};
  for (const c of counters) counterMap[c.category] = c.current_no;

  function toggleToken(key: TokenKey) {
    setTokens((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function resetForm() {
    setStep(1); setName(""); setIts(""); setAge(""); setContact("");
    setTokens(defaultTokens()); setError(""); setShowForm(false);
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/sehat/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, its_number: its, age: parseInt(age), contact,
          camp_year: "1448",
          tokens: {
            ortho:       tokens.ortho,
            examination: tokens.examination,
            physio:      tokens.physio,
            dental:      tokens.dental,
            other:       tokens.other,
            other_label: tokens.other_label,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Save failed"); return; }
      resetForm();
      router.push(`/sehat/admin/camp/${data.patient_id}`);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, pname: string) {
    if (!confirm(`Delete patient "${pname}"? This cannot be undone.`)) return;
    await fetch(`/api/sehat/patients/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function tokenSummary(p: PatientRow) {
    const rec = p.sehat_medical_records[0];
    if (!rec) return "—";
    const parts = [];
    if (rec.token_ortho)       parts.push(`Ortho #${rec.token_ortho_number}`);
    if (rec.token_examination) parts.push(`Exam #${rec.token_examination_number}`);
    if (rec.token_physio)      parts.push(`Physio #${rec.token_physio_number}`);
    if (rec.token_dental)      parts.push(`Dental #${rec.token_dental_number}`);
    if (rec.token_other)       parts.push(`Other #${rec.token_other_number}`);
    return parts.join(", ") || "—";
  }

  return (
    <div>
      {/* Add patient button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm mb-8 transition-opacity hover:opacity-90"
          style={{ background: "var(--color-gold)", color: "var(--color-navy)" }}
        >
          <UserPlus className="w-4 h-4" /> Add Patient
        </button>
      )}

      {/* 2-step add form */}
      {showForm && (
        <div className="rounded-2xl border bg-white p-6 mb-8 max-w-lg shadow-sm"
          style={{ borderColor: "rgba(207,155,0,0.3)" }}>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s
                    ? "text-white"
                    : step > s
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-400"
                }`} style={step === s ? { background: "var(--color-gold)", color: "var(--color-navy)" } : {}}>
                  {s}
                </div>
                <span className={`text-xs ${step === s ? "font-semibold" : "text-gray-400"}`}
                  style={step === s ? { color: "var(--color-navy)" } : {}}>
                  {s === 1 ? "Patient Details" : "Assign Tokens"}
                </span>
                {s < 2 && <ChevronRight className="w-3 h-3 text-gray-300" />}
              </div>
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-navy)" }}>Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Patient full name"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: "#d1d5db" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-navy)" }}>ITS Number</label>
                <input value={its} onChange={(e) => setIts(e.target.value)} placeholder="8-digit ITS number"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: "#d1d5db" }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-navy)" }}>Age</label>
                  <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" type="number" min={1} max={120}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                    style={{ borderColor: "#d1d5db" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-navy)" }}>Contact Number</label>
                  <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Mobile number"
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                    style={{ borderColor: "#d1d5db" }} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={resetForm}
                  className="flex-1 py-2 rounded-lg border text-sm text-gray-500 hover:bg-gray-50"
                  style={{ borderColor: "#d1d5db" }}>
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!name || !its || !age || !contact) { setError("All fields required."); return; }
                    setError(""); setStep(2);
                  }}
                  className="flex-1 py-2 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ background: "var(--color-gold)", color: "var(--color-navy)" }}
                >
                  Next: Assign Tokens →
                </button>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Select required checkups for <strong className="text-gray-800">{name}</strong>:</p>

              <div className="space-y-3">
                {CATEGORIES.map((cat) => {
                  const nextNo = (counterMap[cat.key] ?? 0) + 1;
                  const selected = tokens[cat.key as TokenKey];
                  return (
                    <div key={cat.key} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleToken(cat.key as TokenKey)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected ? "border-transparent" : "border-gray-300 bg-white"
                        }`}
                        style={selected ? { background: "var(--color-gold)", borderColor: "var(--color-gold)" } : {}}
                        aria-label={`Toggle ${cat.label}`}
                      >
                        {selected && (
                          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>

                      <span className="text-sm font-medium w-28" style={{ color: "var(--color-navy)" }}>
                        {cat.label}
                      </span>

                      {cat.key === "other" && selected && (
                        <input
                          value={tokens.other_label}
                          onChange={(e) => setTokens((prev) => ({ ...prev, other_label: e.target.value }))}
                          placeholder="Specify…"
                          className="border rounded px-2 py-1 text-xs w-32 outline-none"
                          style={{ borderColor: "#d1d5db" }}
                        />
                      )}

                      <span className={`text-xs ml-auto ${selected ? "font-bold" : "text-gray-400"}`}
                        style={selected ? { color: "var(--color-gold)" } : {}}>
                        {selected ? `→ Token #${nextNo}` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setStep(1); setError(""); }}
                  className="flex-1 py-2 rounded-lg border text-sm text-gray-500 hover:bg-gray-50"
                  style={{ borderColor: "#d1d5db" }}>
                  ← Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !CATEGORIES.some((c) => tokens[c.key as TokenKey])}
                  className="flex-1 py-2 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-50"
                  style={{ background: "var(--color-navy)", color: "white" }}
                >
                  {saving ? "Saving…" : "Save & Open Record"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patient table */}
      {patients.length === 0 ? (
        <p className="text-gray-400 text-sm">No patients registered yet.</p>
      ) : (
        <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide text-gray-400"
                style={{ background: "#fafafa" }}>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">ITS</th>
                <th className="px-4 py-3 text-left">Age</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Tokens</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--color-navy)" }}>{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.its_number}</td>
                  <td className="px-4 py-3 text-gray-500">{p.age}</td>
                  <td className="px-4 py-3 text-gray-500">{p.contact}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{tokenSummary(p)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/sehat/admin/camp/${p.id}`}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors hover:opacity-80"
                        style={{ background: "rgba(207,155,0,0.1)", color: "var(--color-gold)" }}>
                        <FileText className="w-3.5 h-3.5" /> Record
                      </a>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
