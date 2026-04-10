import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import RecordClient from "./RecordClient";
import { getSehatClient } from "@/lib/supabase/sehat";

export const metadata: Metadata = { title: "Health Screening Card" };
export const revalidate = 0;

export type Patient = {
  id: string; name: string; its_number: string; age: number; contact: string; camp_year: string;
};

export type MedicalRecord = {
  id: string; patient_id: string;
  token_ortho: boolean; token_ortho_number: number | null;
  token_examination: boolean; token_examination_number: number | null;
  token_physio: boolean; token_physio_number: number | null;
  token_dental: boolean; token_dental_number: number | null;
  token_other: boolean; token_other_label: string | null; token_other_number: number | null;
  ecg: string | null; ecg_doctor: string | null;
  bp: string | null; bp_doctor: string | null;
  pulse: string | null; pulse_doctor: string | null;
  spo2: string | null; spo2_doctor: string | null;
  bsl: string | null; bsl_doctor: string | null;
  height: string | null; weight: string | null;
  bmi: string | null; bmi_doctor: string | null;
  dental_remarks: string | null; dental_doctor: string | null;
  ortho_remarks: string | null; ortho_doctor: string | null;
  extra_remarks: string | null;
};

export default async function RecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSehatClient();

  const [patientRes, recordRes] = await Promise.all([
    supabase.from("sehat_patients").select("*").eq("id", id).single(),
    supabase.from("sehat_medical_records").select("*").eq("patient_id", id).single(),
  ]);

  if (patientRes.error || !patientRes.data) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 no-print">
        <Link href="/sehat/admin/camp" className="text-sm" style={{ color: "var(--color-gold)" }}>
          ← Patient List
        </Link>
      </div>

      <RecordClient
        patient={patientRes.data as Patient}
        record={recordRes.data as MedicalRecord | null}
      />
    </div>
  );
}
