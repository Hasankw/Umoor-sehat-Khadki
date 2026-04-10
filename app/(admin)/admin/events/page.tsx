import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Event, Umoor } from "@/types";
import EventsAdminClient from "./EventsAdminClient";

export const metadata: Metadata = { title: "Events Admin — Khadki Jamaat" };
export const revalidate = 60;

export default async function EventsAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["super_admin","umoor_admin"].includes(profile.role)) redirect("/admin");

  const [eventsRes, umoorsRes] = await Promise.all([
    supabase.from("events").select("*, umoor:umoors(name)").order("event_date", { ascending: false }).limit(30),
    supabase.from("umoors").select("id, name").order("display_order"),
  ]);

  return (
    <div className="p-8">
      <h1 className="font-heading font-bold text-2xl mb-6" style={{ color: "var(--color-navy)" }}>
        Events Management
      </h1>
      <EventsAdminClient
        events={(eventsRes.data || []) as Event[]}
        umoors={(umoorsRes.data || []) as Pick<Umoor,"id"|"name">[]}
      />
    </div>
  );
}
