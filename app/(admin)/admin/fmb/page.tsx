import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FmbMenu } from "@/types";
import { format, startOfMonth, endOfMonth } from "date-fns";
import FmbAdminClient from "./FmbAdminClient";

export const metadata: Metadata = { title: "FMB Admin — Khadki Jamaat" };
export const revalidate = 60;

export default async function FmbAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["super_admin","umoor_admin"].includes(profile.role)) redirect("/admin");

  const today = new Date();
  const start = format(startOfMonth(today), "yyyy-MM-dd");
  const end   = format(endOfMonth(today),   "yyyy-MM-dd");

  const { data } = await supabase
    .from("fmb_menu")
    .select("*")
    .gte("date", start)
    .lte("date", end)
    .order("date")
    .order("meal_type");

  const menus = (data || []) as FmbMenu[];

  return (
    <div className="p-8">
      <h1 className="font-heading font-bold text-2xl mb-2" style={{ color: "var(--color-navy)" }}>
        FMB Menu Admin
      </h1>
      <p className="text-gray-400 text-sm mb-6">Post and manage daily Faza ul Mawaid Buhaniyah menus</p>
      <FmbAdminClient menus={menus} />
    </div>
  );
}
