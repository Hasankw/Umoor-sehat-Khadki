import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import HallsBookingClient from "./HallsBookingClient";
import { Facility } from "@/types";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Hall Booking — Fakri & Shujai Hall",
  description: "Book Fakri Hall or Shujai Hall for your community event.",
};

export const revalidate = 30;

export default async function HallsPage() {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [facilitiesRes, bookingsRes] = await Promise.all([
    supabase.from("facilities").select("*").in("type", ["hall_fakri", "hall_shujai"]),
    supabase.from("bookings")
      .select("date, status, facility_id, start_time, end_time")
      .eq("status", "confirmed")
      .gte("date", today),
  ]);

  const facilities = (facilitiesRes.data || []) as Facility[];
  const bookings   = (bookingsRes.data || []) as { date: string; status: "confirmed" | "pending"; facility_id: string }[];

  return (
    <div className="min-h-screen bg-cream">
      <div className="py-12 px-4" style={{ background: "var(--color-navy)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="h-1 w-12 rounded mb-4" style={{ background: "var(--color-gold)" }} />
          <h1 className="font-heading font-bold text-3xl text-white mb-2">Hall Booking</h1>
          <p className="text-white/60">Book Fakri Hall or Shujai Hall for your event</p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <HallsBookingClient facilities={facilities} bookings={bookings} />
      </div>
    </div>
  );
}
