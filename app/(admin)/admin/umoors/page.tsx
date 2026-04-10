import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Umoor } from "@/types";
import UmoorsAdminClient from "./UmoorsAdminClient";

export const metadata: Metadata = { title: "Umoors Admin — Khadki Jamaat" };
export const revalidate = 0;

export default async function UmoorsAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") redirect("/admin");

  const { data } = await supabase.from("umoors").select("*").order("display_order");

  return (
    <div className="p-8">
      <h1 className="font-heading font-bold text-2xl mb-2" style={{ color: "var(--color-navy)" }}>
        Umoors Management
      </h1>
      <p className="text-gray-400 text-sm mb-6">Edit contact info inline — click the pencil icon</p>
      <UmoorsAdminClient umoors={(data || []) as Umoor[]} />
    </div>
  );
}
