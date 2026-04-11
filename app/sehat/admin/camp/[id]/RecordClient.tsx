"use client";

import { useState } from "react";
import Image from "next/image";
import { Patient, MedicalRecord } from "./page";
import { Save, Printer } from "lucide-react";

function blank(v: string | null | undefined): string {
  return v ?? "";
}

export default function RecordClient({
  patient,
  record: initialRecord,
}: {
  patient: Patient;
  record: MedicalRecord | null;
}) {
  const [rec, setRec]           = useState<Partial<MedicalRecord>>(initialRecord ?? {});
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");
  const [printPage2, setPrintPage2] = useState(false);

  function field(key: keyof MedicalRecord) { return blank(rec[key] as string | null); }
  function update(key: keyof MedicalRecord, value: string) {
    setSaved(false);
    setRec((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`/api/sehat/records/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rec),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Save failed"); return; }
      setSaved(true);
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  }

  function handlePrint(includePage2: boolean) {
    setPrintPage2(includePage2);
    setTimeout(() => window.print(), 100);
  }

  const tokens = [
    { key: "token_ortho",       numKey: "token_ortho_number",       label: "Ortho" },
    { key: "token_examination", numKey: "token_examination_number", label: "Examination" },
    { key: "token_physio",      numKey: "token_physio_number",      label: "Physio" },
    { key: "token_dental",      numKey: "token_dental_number",      label: "Dental" },
    { key: "token_other",       numKey: "token_other_number",       label: blank(rec.token_other_label) || "Other" },
  ] as const;

  const inp  = "w-full border-b border-gray-300 bg-transparent text-[11px] py-0.5 outline-none focus:border-gray-600 placeholder:text-gray-300";
  const lbl  = "text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5 block";
  const box  = "border border-gray-300 rounded p-3 flex flex-col";

  return (
    <>
      {/* ── Action bar (screen only) ── */}
      <div className="no-print flex flex-wrap items-center gap-3 mb-4">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-60"
          style={{ background: "var(--color-navy)", color: "white" }}>
          <Save className="w-4 h-4" />{saving ? "Saving…" : "Save"}
        </button>
        <button onClick={() => handlePrint(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border hover:bg-gray-50"
          style={{ borderColor: "#d1d5db", color: "var(--color-navy)" }}>
          <Printer className="w-4 h-4" /> Print Page 1 Only
        </button>
        <button onClick={() => handlePrint(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border hover:bg-gray-50"
          style={{ borderColor: "#d1d5db", color: "var(--color-navy)" }}>
          <Printer className="w-4 h-4" /> Print Both Pages
        </button>
        {saved && <span className="text-green-600 text-sm font-medium">Saved ✓</span>}
        {error && <span className="text-red-500 text-sm">{error}</span>}
      </div>

      {/* ═══════════════════ PAGE 1 — A4 ═══════════════════ */}
      <div id="print-page-1"
        className="bg-white rounded-2xl shadow-sm border border-gray-200 print:shadow-none print:border-0 print:rounded-none flex flex-col"
        style={{
          width: "794px",
          height: "1123px",        /* exact A4 at 96dpi */
          margin: "0 auto",
          padding: "24px 32px",
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          boxSizing: "border-box",
        }}>

        {/* ── Letterhead ── */}
        <div className="flex items-center justify-center mb-1 flex-shrink-0">
          <Image src="/images/logo-final.jpg" alt="" width={360} height={112} className="object-contain" style={{ maxHeight: 72 }} />
        </div>
        <p className="text-center text-[10px] tracking-widest uppercase text-gray-500 mb-1 flex-shrink-0">
          Dawat-e-Hadiyah | Jamaat Kirkee, Poona
        </p>
        <div className="text-center mb-3 flex-shrink-0">
          <div className="inline-block border-2 px-8 py-1 rounded" style={{ borderColor: "var(--color-gold)" }}>
            <p className="font-bold text-sm tracking-wide" style={{ color: "var(--color-navy)" }}>HEALTH SCREENING CARD</p>
            <p className="text-[10px] text-gray-500">Ashara Ohabat 1448H — Special Medical Camp</p>
          </div>
        </div>

        <hr className="border-gray-300 mb-3 flex-shrink-0" />

        {/* ── Patient + Tokens ── */}
        <div className="grid grid-cols-2 gap-6 mb-3 flex-shrink-0">
          <div>
            <p className={lbl}>Patient Details</p>
            <table className="w-full" style={{ fontSize: "12px", borderCollapse: "collapse" }}>
              <tbody>
                {[["Name", patient.name], ["ITS No", patient.its_number], ["Age", String(patient.age)], ["Contact", patient.contact]].map(([k, v]) => (
                  <tr key={k}>
                    <td className="pr-3 font-semibold text-gray-600 py-1 w-16" style={{ fontSize: 11 }}>{k}:</td>
                    <td className="font-medium py-1" style={{ color: "var(--color-navy)", fontSize: 12 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className={lbl}>Tokens Issued</p>
            <div className="space-y-1.5">
              {tokens.map((t) => {
                const selected = rec[t.key as keyof MedicalRecord] as boolean | undefined;
                const num      = rec[t.numKey as keyof MedicalRecord] as number | null | undefined;
                return (
                  <div key={t.key} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${selected ? "border-transparent" : "border-gray-400"}`}
                      style={selected ? { background: "var(--color-gold)" } : {}}>
                      {selected && <svg viewBox="0 0 10 10" className="w-2.5 h-2.5"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                    </div>
                    <span className={`text-[12px] flex-1 ${selected ? "font-semibold" : "text-gray-400"}`} style={selected ? { color: "var(--color-navy)" } : {}}>{t.label}</span>
                    {selected && num != null
                      ? <span className="text-[11px] font-bold px-2 rounded" style={{ background: "rgba(207,155,0,0.15)", color: "var(--color-gold)" }}>#{num}</span>
                      : <span className="text-[10px] text-gray-300">—</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <hr className="border-gray-200 mb-3 flex-shrink-0" />

        {/* ── Clinical Measurements ── */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-center text-gray-500 mb-2 flex-shrink-0">Clinical Measurements</p>

        {/* 6 vitals in one row */}
        <div className="grid grid-cols-6 gap-2 mb-2 flex-shrink-0 border border-gray-200 rounded p-3">
          {[
            { k: "ecg",   label: "ECG",   ph: "Value" },
            { k: "bp",    label: "BP",    ph: "mmHg" },
            { k: "pulse", label: "Pulse", ph: "bpm" },
            { k: "spo2",  label: "SpO2",  ph: "%" },
            { k: "bsl",   label: "BSL",   ph: "mg/dL" },
          ].map(({ k, label, ph }) => (
            <div key={k}>
              <p className={lbl}>{label}</p>
              <input value={field(k as keyof MedicalRecord)} onChange={(e) => update(k as keyof MedicalRecord, e.target.value)} placeholder={ph} className={inp} />
            </div>
          ))}
          {/* BMI */}
          <div>
            <p className={lbl}>BMI</p>
            <div className="flex gap-1 mb-1">
              <input value={field("height")} onChange={(e) => update("height", e.target.value)} placeholder="Ht cm" className={inp} style={{ width: "50%" }} />
              <input value={field("weight")} onChange={(e) => update("weight", e.target.value)} placeholder="Wt kg" className={inp} style={{ width: "50%" }} />
            </div>
            <input value={field("bmi")} onChange={(e) => update("bmi", e.target.value)} placeholder="BMI" className={inp} />
          </div>
        </div>

        {/* Shared doctor signature for all vitals */}
        <div className="grid grid-cols-2 gap-6 mb-3 px-1 flex-shrink-0">
          <div>
            <p className={lbl}>Doctor Name</p>
            <input value={field("ecg_doctor")} onChange={(e) => update("ecg_doctor", e.target.value)} placeholder="Doctor's full name" className={inp} />
          </div>
          <div>
            <p className={lbl}>Doctor Signature</p>
            <div className="border-b border-gray-300" style={{ minHeight: 24 }} />
          </div>
        </div>

        <hr className="border-gray-200 mb-3 flex-shrink-0" />

        {/* ── Dental Remarks (full width, flex-grow) ── */}
        <div className={`${box} mb-3 flex-1`}>
          <p className={lbl}>Dental Rx</p>
          <textarea
            value={field("dental_remarks")}
            onChange={(e) => update("dental_remarks", e.target.value)}
            placeholder="Dental observations and recommendations…"
            className="flex-1 w-full bg-transparent text-[11px] outline-none resize-none placeholder:text-gray-300 min-h-0"
          />
          <div className="mt-2 pt-2 border-t border-dashed border-gray-200 grid grid-cols-2 gap-4 flex-shrink-0">
            <div>
              <p className={lbl}>Dental Doctor</p>
              <input value={field("dental_doctor")} onChange={(e) => update("dental_doctor", e.target.value)} placeholder="Doctor name" className={inp} />
            </div>
            <div>
              <p className={lbl}>Signature</p>
              <div className="border-b border-gray-300" style={{ minHeight: 22 }} />
            </div>
          </div>
        </div>

        {/* ── Ortho Remarks (full width, flex-grow) ── */}
        <div className={`${box} flex-1`}>
          <p className={lbl}>Ortho Rx</p>
          <textarea
            value={field("ortho_remarks")}
            onChange={(e) => update("ortho_remarks", e.target.value)}
            placeholder="Orthopaedic observations and recommendations…"
            className="flex-1 w-full bg-transparent text-[11px] outline-none resize-none placeholder:text-gray-300 min-h-0"
          />
          <div className="mt-2 pt-2 border-t border-dashed border-gray-200 grid grid-cols-2 gap-4 flex-shrink-0">
            <div>
              <p className={lbl}>Ortho Doctor</p>
              <input value={field("ortho_doctor")} onChange={(e) => update("ortho_doctor", e.target.value)} placeholder="Doctor name" className={inp} />
            </div>
            <div>
              <p className={lbl}>Signature</p>
              <div className="border-b border-gray-300" style={{ minHeight: 22 }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-2 text-center text-[9px] text-gray-400 flex-shrink-0">
          Jamaat Kirkee, Poona — Umoor Sehat | Confidential Medical Record
        </p>
      </div>

      {/* ═══════════════════ PAGE 2 ═══════════════════ */}
      <div id="print-page-2"
        className={`mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col print:shadow-none print:border-0 print:rounded-none print:mt-0 ${printPage2 ? "print:flex" : "print:hidden"}`}
        style={{ width: "794px", height: "1123px", margin: "24px auto 0", padding: "24px 32px", fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}>

        <div className="flex items-center justify-center mb-1 flex-shrink-0">
          <Image src="/images/logo-final.jpg" alt="" width={360} height={112} className="object-contain" style={{ maxHeight: 72 }} />
        </div>
        <p className="text-center text-[10px] tracking-widest uppercase text-gray-500 mb-1 flex-shrink-0">Dawat-e-Hadiyah | Jamaat Kirkee, Poona</p>
        <div className="text-center mb-3 flex-shrink-0">
          <div className="inline-block border-2 px-8 py-1 rounded" style={{ borderColor: "var(--color-gold)" }}>
            <p className="font-bold text-sm tracking-wide" style={{ color: "var(--color-navy)" }}>ADDITIONAL REMARKS</p>
            <p className="text-[10px] text-gray-500">Ashara Ohabat 1448H — Special Medical Camp</p>
          </div>
        </div>
        <hr className="border-gray-300 mb-3 flex-shrink-0" />
        <div className="flex gap-6 text-[11px] mb-4 flex-shrink-0">
          <span className="text-gray-500">Patient: <strong style={{ color: "var(--color-navy)" }}>{patient.name}</strong></span>
          <span className="text-gray-500">ITS: <strong>{patient.its_number}</strong></span>
          <span className="text-gray-500">Age: <strong>{patient.age}</strong></span>
        </div>
        <div className="border border-gray-300 rounded p-4 flex-1 flex flex-col">
          <p className={`${lbl} flex-shrink-0`}>Additional Rx</p>
          <textarea value={field("extra_remarks")} onChange={(e) => update("extra_remarks", e.target.value)}
            placeholder="Additional clinical notes, follow-up instructions, referrals, prescriptions…"
            className="flex-1 w-full bg-transparent text-[11px] outline-none resize-none placeholder:text-gray-300 min-h-0" />
        </div>
        <p className="mt-2 text-center text-[9px] text-gray-400 flex-shrink-0">Jamaat Kirkee, Poona — Umoor Sehat | Page 2</p>
      </div>

      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          .no-print,
          header,
          nav,
          footer { display: none !important; }

          body {
            margin: 0;
            padding: 0;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #print-page-1 {
            width: 210mm !important;
            height: 297mm !important;
            padding: 14mm 18mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            page-break-after: always;
            box-sizing: border-box !important;
          }
          #print-page-2 {
            width: 210mm !important;
            height: 297mm !important;
            padding: 14mm 18mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
          }
          input, textarea {
            border: none !important;
            border-bottom: 1px solid #999 !important;
            outline: none !important;
            background: transparent !important;
          }
        }
      `}</style>
    </>
  );
}
