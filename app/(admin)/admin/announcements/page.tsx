import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Announcement } from "@/types";
import AnnouncementsAdminClient from "./AnnouncementsAdminClient";

export const metadata: Metadata = { title: "Announcements Admin — Khadki Jamaat" };
export const revalidate = 0;

export default async function AnnouncementsAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["super_admin","umoor_admin"].includes(profile.role)) redirect("/admin");

  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <h1 className="font-heading font-bold text-2xl mb-2" style={{ color: "var(--color-navy)" }}>
        Announcements
      </h1>
      <p className="text-gray-400 text-sm mb-6">Manage the ticker shown on the home page</p>
      <AnnouncementsAdminClient announcements={(data || []) as Announcement[]} />
    </div>
  );
}
