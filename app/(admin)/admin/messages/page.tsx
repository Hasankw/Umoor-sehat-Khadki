import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Message, Umoor } from "@/types";
import MessagesAdminClient from "./MessagesAdminClient";

export const metadata: Metadata = { title: "Messages Admin — Khadki Jamaat" };
export const revalidate = 30;

export default async function MessagesAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role, umoor_id").eq("id", user.id).single();
  if (!profile || !["super_admin","umoor_admin","madrasa_admin","booking_admin"].includes(profile.role)) redirect("/admin");

  let query = supabase
    .from("messages")
    .select("*, umoor:umoors(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  // Non-super-admins only see their umoor's messages
  if (profile.role !== "super_admin" && profile.umoor_id) {
    query = query.eq("to_umoor_id", profile.umoor_id);
  }

  const { data } = await query;
  const messages = (data || []) as (Message & { umoor: Pick<Umoor,"name"> | null })[];

  return (
    <div className="p-8">
      <h1 className="font-heading font-bold text-2xl mb-6" style={{ color: "var(--color-navy)" }}>
        Messages Inbox
      </h1>
      <MessagesAdminClient messages={messages} />
    </div>
  );
}
