"use client";

import { useState } from "react";
import { Booking, BookingStatus, Facility } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { CheckCircle2, XCircle } from "lucide-react";

type EnrichedBooking = Booking & { facility: Pick<Facility,"name"|"type"> | null };

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending:   "status-pending",
  confirmed: "status-confirmed",
  cancelled: "status-cancelled",
};

export default function BookingsAdminClient({
  bookings: initial,
  facilities,
}: {
  bookings: EnrichedBooking[];
  facilities: Pick<Facility,"id"|"name"|"type">[];
}) {
  const [bookings,   setBookings]   = useState(initial);
  const [filter,     setFilter]     = useState<BookingStatus | "all">("all");
  const [facilityF,  setFacilityF]  = useState("all");

  async function updateStatus(id: string, status: BookingStatus) {
    const supabase = createClient();
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setBookings(bookings.map((b) => b.id === id ? { ...b, status } : b));
    toast.success(`Booking ${status}`);
  }

  const displayed = bookings.filter((b) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (facilityF !== "all" && b.facility_id !== facilityF) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(["all","pending","confirmed","cancelled"] as const).map((s) => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`text-sm px-4 py-1.5 rounded-full border font-medium transition-colors ${
              filter === s ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600"
            }`}
            style={filter === s ? { background: "var(--color-navy)" } : {}}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== "all" && ` (${bookings.filter((b) => b.status === s).length})`}
          </button>
        ))}
        <select value={facilityF} onChange={(e) => setFacilityF(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-full border bg-white text-gray-600">
          <option value="all">All Facilities</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden"
        style={{ borderColor: "rgba(207,155,0,0.2)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ background: "var(--color-navy)", color: "white" }}>
                {["Facility","Event","Date","Time","Guests","Status","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No bookings found.</td></tr>
              ) : displayed.map((b) => (
                <tr key={b.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs">{b.facility?.name ?? "—"}</p>
                    <p className="text-xs text-gray-400">{b.facility?.type}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{b.event_name}</p>
                    <p className="text-xs text-gray-400">{b.event_type}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {format(parseISO(b.date), "EEE, d MMM yyyy")}
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                    {b.start_time} – {b.end_time}
                  </td>
                  <td className="px-4 py-3 text-center">{b.attendees}</td>
                  <td className="px-4 py-3">
                    <span className={STATUS_STYLES[b.status]}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {b.status === "pending" && (
                      <div className="flex gap-1">
                        <button onClick={() => updateStatus(b.id, "confirmed")}
                          className="p-1.5 rounded hover:bg-green-50" title="Confirm">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </button>
                        <button onClick={() => updateStatus(b.id, "cancelled")}
                          className="p-1.5 rounded hover:bg-red-50" title="Cancel">
                          <XCircle className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
