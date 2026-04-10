import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Building2, Users, CheckCircle2 } from "lucide-react";
import SanitariumBookingClient from "./SanitariumBookingClient";
import { Facility, Booking } from "@/types";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Sanitarium Booking",
  description: "Book your stay at Khadki Bohra Sanitarium.",
};

export const revalidate = 30;

export default async function SanitariumPage() {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [facilityRes, bookingsRes] = await Promise.all([
    supabase.from("facilities").select("*").eq("type", "sanitarium").single(),
    supabase.from("bookings")
      .select("date, status")
      .eq("status", "confirmed")
      .gte("date", today),
  ]);

  const facility = facilityRes.data as Facility | null;
  const bookedDates = (bookingsRes.data || []) as Pick<Booking, "date" | "status">[];

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="py-12 px-4" style={{ background: "var(--color-navy)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="h-1 w-12 rounded mb-4" style={{ background: "var(--color-gold)" }} />
          <h1 className="font-heading font-bold text-3xl text-white mb-2">Sanitarium Booking</h1>
          <p className="text-white/60">Book accommodation at Khadki Bohra Sanitarium</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {facility && (
          <div className="rounded-xl border bg-white p-6 mb-8"
            style={{ borderColor: "rgba(207,155,0,0.2)" }}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg" style={{ background: "rgba(207,155,0,0.1)" }}>
                <Building2 className="w-6 h-6" style={{ color: "var(--color-gold)" }} />
              </div>
              <div className="flex-1">
                <h2 className="font-heading font-bold text-lg" style={{ color: "var(--color-navy)" }}>
                  {facility.name}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{facility.description}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>Capacity: {facility.capacity} guests</span>
                </div>
                {Array.isArray(facility.amenities) && facility.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(facility.amenities as string[]).map((a) => (
                      <span key={a}
                        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(207,155,0,0.08)", color: "var(--color-gold-dark)" }}>
                        <CheckCircle2 className="w-3 h-3" />{a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <SanitariumBookingClient
          facilityId={facility?.id ?? ""}
          bookedDates={bookedDates.map((b) => ({ date: b.date, status: b.status as "confirmed" | "pending" }))}
        />
      </div>
    </div>
  );
}
