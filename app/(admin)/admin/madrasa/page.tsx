import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MadrasaStudent, MadrasaAttendance, MadrasaResult } from "@/types";
import MadrasaAdminClient from "./MadrasaAdminClient";

export const metadata: Metadata = { title: "Madrasa Admin — Khadki Jamaat" };
export const revalidate = 0;

export default async function MadrasaAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["super_admin","madrasa_admin"].includes(profile.role)) redirect("/admin");

  const [studentsRes, attendRes, resultsRes] = await Promise.all([
    supabase.from("madrasa_students").select("*").order("name"),
    supabase.from("madrasa_attendance").select("*").order("date", { ascending: false }).limit(500),
    supabase.from("madrasa_results").select("*").order("id", { ascending: false }).limit(200),
  ]);

  return (
    <div className="p-8">
      <h1 className="font-heading font-bold text-2xl mb-2" style={{ color: "var(--color-navy)" }}>
        Madrasa Admin
      </h1>
      <p className="text-gray-400 text-sm mb-6">
        {studentsRes.data?.filter((s: MadrasaStudent) => s.active).length ?? 0} active students
      </p>
      <MadrasaAdminClient
        students={(studentsRes.data || []) as MadrasaStudent[]}
        attendance={(attendRes.data || []) as MadrasaAttendance[]}
        results={(resultsRes.data || []) as MadrasaResult[]}
      />
    </div>
  );
}
