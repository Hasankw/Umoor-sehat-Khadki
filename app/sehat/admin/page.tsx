import { Metadata } from "next";
import Link from "next/link";
import { Stethoscope, Users } from "lucide-react";
import { getSehatClient } from "@/lib/supabase/sehat";

export const metadata: Metadata = { title: "Sehat Admin — Dashboard" };
export const revalidate = 0;

const CATEGORIES = [
  { key: "ortho",       label: "Ortho",       color: "bg-blue-50 border-blue-200 text-blue-800" },
  { key: "examination", label: "Examination", color: "bg-purple-50 border-purple-200 text-purple-800" },
  { key: "physio",      label: "Physio",      color: "bg-green-50 border-green-200 text-green-800" },
  { key: "dental",      label: "Dental",      color: "bg-rose-50 border-rose-200 text-rose-800" },
  { key: "other",       label: "Other",       color: "bg-gray-50 border-gray-200 text-gray-700" },
] as const;

export default async function SehatDashboard() {
  const supabase = getSehatClient();

  const [countersRes, patientCountRes] = await Promise.all([
    supabase.from("sehat_token_counters").select("category, current_no").eq("camp_year", "1448"),
    supabase.from("sehat_patients").select("id", { count: "exact" }).eq("camp_year", "1448"),
  ]);

  const counters: Record<string, number> = {};
  for (const row of countersRes.data ?? []) {
    counters[row.category] = row.current_no;
  }

  const totalPatients = patientCountRes.count ?? 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl" style={{ color: "var(--color-navy)" }}>
          Sehat Admin Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">Ashara Ohabat 1448H — Camp Year</p>
      </div>

      {/* Total patients */}
      <div className="flex items-center gap-4 rounded-xl border p-5 mb-8 bg-white"
        style={{ borderColor: "rgba(207,155,0,0.3)" }}>
        <div className="p-3 rounded-xl" style={{ background: "rgba(207,155,0,0.1)" }}>
          <Users className="w-6 h-6" style={{ color: "var(--color-gold)" }} />
        </div>
        <div>
          <p className="text-3xl font-bold" style={{ color: "var(--color-navy)" }}>{totalPatients}</p>
          <p className="text-sm text-gray-500">Total Patients Registered</p>
        </div>
      </div>

      {/* Token counters */}
      <h2 className="font-heading font-semibold text-base mb-4" style={{ color: "var(--color-navy)" }}>
        Token Counters — Current
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-10">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className={`rounded-xl border p-4 text-center ${cat.color}`}>
            <p className="text-3xl font-bold mb-1">{counters[cat.key] ?? 0}</p>
            <p className="text-xs font-semibold uppercase tracking-wide">{cat.label}</p>
          </div>
        ))}
      </div>

      {/* Camp menu card */}
      <h2 className="font-heading font-semibold text-base mb-4" style={{ color: "var(--color-navy)" }}>
        Manage
      </h2>
      <Link href="/sehat/admin/camp"
        className="flex items-center gap-5 rounded-2xl border bg-white p-6 hover:shadow-lg transition-all max-w-sm"
        style={{ borderColor: "rgba(207,155,0,0.25)" }}>
        <div className="p-3 rounded-xl" style={{ background: "rgba(207,155,0,0.1)" }}>
          <Stethoscope className="w-7 h-7" style={{ color: "var(--color-gold)" }} />
        </div>
        <div>
          <p className="font-heading font-bold text-base" style={{ color: "var(--color-navy)" }}>
            Ashara Ohabat Special Medical Camp
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Patient management & health records</p>
        </div>
      </Link>
    </div>
  );
}
