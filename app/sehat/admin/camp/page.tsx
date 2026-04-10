import { Metadata } from "next";
import Link from "next/link";
import CampClient from "./CampClient";
import QueueBoard from "./QueueBoard";
import { getSehatClient } from "@/lib/supabase/sehat";

export const metadata: Metadata = { title: "Medical Camp — Patients" };
export const revalidate = 0;

export type PatientRow = {
  id: string;
  name: string;
  its_number: string;
  age: number;
  contact: string;
  camp_year: string;
  created_at: string;
  sehat_medical_records: {
    id: string;
    token_ortho: boolean; token_ortho_number: number | null;
    token_examination: boolean; token_examination_number: number | null;
    token_physio: boolean; token_physio_number: number | null;
    token_dental: boolean; token_dental_number: number | null;
    token_other: boolean; token_other_label: string | null; token_other_number: number | null;
    ortho_done: boolean; examination_done: boolean;
    physio_done: boolean; dental_done: boolean; other_done: boolean;
  }[];
};

export type CounterRow = { category: string; current_no: number };

export default async function CampPage() {
  const supabase = getSehatClient();

  const [patientsRes, countersRes] = await Promise.all([
    supabase
      .from("sehat_patients")
      .select(`*, sehat_medical_records(
        id,
        token_ortho, token_ortho_number, ortho_done,
        token_examination, token_examination_number, examination_done,
        token_physio, token_physio_number, physio_done,
        token_dental, token_dental_number, dental_done,
        token_other, token_other_label, token_other_number, other_done
      )`)
      .eq("camp_year", "1448")
      .order("created_at", { ascending: false }),
    supabase.from("sehat_token_counters").select("category, current_no").eq("camp_year", "1448"),
  ]);

  const patients = (patientsRes.data ?? []) as PatientRow[];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/sehat/admin" className="text-sm" style={{ color: "var(--color-gold)" }}>
          ← Dashboard
        </Link>
      </div>
      <h1 className="font-heading font-bold text-2xl mb-1" style={{ color: "var(--color-navy)" }}>
        Ashara Ohabat Special Medical Camp
      </h1>
      <p className="text-gray-500 text-sm mb-8">1448H | Kirkee Jamaat, Poona</p>

      <CampClient
        patients={patients}
        counters={(countersRes.data ?? []) as CounterRow[]}
      />

      {/* Live queue board */}
      <QueueBoard
        initialPatients={patients.map((p) => ({
          id: p.id,
          name: p.name,
          sehat_medical_records: p.sehat_medical_records,
        }))}
      />
    </div>
  );
}
