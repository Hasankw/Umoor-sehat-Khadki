import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AsharaConfig, AsharaScheduleDay, AsharaUpdate } from "@/types";
import AsharaAdminClient from "./AsharaAdminClient";

export const metadata: Metadata = { title: "Ashara Admin — Khadki Jamaat" };
export const revalidate = 30;

export default async function AsharaAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/ashara");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["super_admin","umoor_admin"].includes(profile.role)) redirect("/admin");

  const [configRes, scheduleRes, updatesRes] = await Promise.all([
    supabase.from("ashara_config").select("*").eq("year", 1448).single(),
    supabase.from("ashara_schedule")
      .select("*")
      .order("day_number"),
    supabase.from("ashara_updates")
      .select("*")
      .order("pinned", { ascending: false })
      .order("posted_at", { ascending: false }),
  ]);

  const config1448 = configRes.data as AsharaConfig | null;
  const schedule   = config1448
    ? (scheduleRes.data || []).filter((s: AsharaScheduleDay) => s.ashara_config_id === config1448.id)
    : [] as AsharaScheduleDay[];
  const updates    = config1448
    ? (updatesRes.data  || []).filter((u: AsharaUpdate) => u.ashara_config_id === config1448.id)
    : [] as AsharaUpdate[];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-bold text-2xl" style={{ color: "var(--color-navy)" }}>
            Ashara 1448H — Admin
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage schedule, updates and status
            {config1448 && ` · Status: `}
            {config1448 && (
              <span className={`status-${config1448.status} ml-1`}>{config1448.status}</span>
            )}
          </p>
        </div>
        {config1448 && (
          <a href="/ashara" target="_blank"
            className="text-sm font-medium hover:underline"
            style={{ color: "var(--color-gold-dark)" }}>
            View public page →
          </a>
        )}
      </div>
      <AsharaAdminClient config={config1448} schedule={schedule} updates={updates} />
    </div>
  );
}
