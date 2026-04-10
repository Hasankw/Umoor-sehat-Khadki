import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Booking, Facility } from "@/types";
import BookingsAdminClient from "./BookingsAdminClient";

export const metadata: Metadata = { title: "Bookings Admin — Khadki Jamaat" };
export const revalidate = 30;

export default async function BookingsAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["super_admin","booking_admin"].includes(profile.role)) redirect("/admin");

  const [bookingsRes, facilitiesRes] = await Promise.all([
    supabase.from("bookings")
      .select("*, facility:facilities(name, type)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("facilities").select("id, name, type"),
  ]);

  const bookings   = (bookingsRes.data   || []) as (Booking & { facility: Pick<Facility,"name"|"type"> | null })[];
  const facilities = (facilitiesRes.data || []) as Pick<Facility,"id"|"name"|"type">[];

  return (
    <div className="p-8">
      <h1 className="font-heading font-bold text-2xl mb-6" style={{ color: "var(--color-navy)" }}>
        Bookings Management
      </h1>
      <BookingsAdminClient bookings={bookings} facilities={facilities} />
    </div>
  );
}
