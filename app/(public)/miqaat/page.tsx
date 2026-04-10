import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MiqaatDate } from "@/types";
import { format, isFuture, isToday, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";

export const metadata: Metadata = {
  title: "Miqaat Calendar — Khadki Jamaat",
  description: "Hijri miqaat dates, Eid, urus and ayyam for Dawoodi Bohra community.",
};

export const revalidate = 3600;

const CATEGORY_COLORS: Record<string, string> = {
  eid:   "bg-green-100 text-green-800 border-green-200",
  urus:  "bg-purple-100 text-purple-800 border-purple-200",
  ayyam: "bg-amber-100 text-amber-800 border-amber-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

export default async function MiqaatPage() {
  const supabase  = await createClient();
  const today     = new Date().toISOString().split("T")[0];

  const [upcomingRes, pastRes] = await Promise.all([
    supabase.from("miqaat_dates").select("*").gte("gregorian_date", today).order("gregorian_date").limit(20),
    supabase.from("miqaat_dates").select("*").lt("gregorian_date", today).order("gregorian_date", { ascending: false }).limit(10),
  ]);

  const upcoming = (upcomingRes.data || []) as MiqaatDate[];
  const past     = (pastRes.data     || []) as MiqaatDate[];

  function MiqaatCard({ m, highlight = false }: { m: MiqaatDate; highlight?: boolean }) {
    return (
      <div className={`rounded-xl border bg-white p-5 ${highlight ? "ring-2" : ""}`}
        style={highlight
          ? { borderColor: "var(--color-gold)", boxShadow: "0 0 0 2px rgba(207,155,0,0.3)" }
          : { borderColor: "rgba(207,155,0,0.15)" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-4">
            {/* Date block */}
            <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 text-white"
              style={{ background: "var(--color-navy)" }}>
              <span className="text-xs font-bold leading-none">
                {format(parseISO(m.gregorian_date), "MMM").toUpperCase()}
              </span>
              <span className="text-2xl font-bold leading-tight">
                {format(parseISO(m.gregorian_date), "d")}
              </span>
            </div>
            <div>
              <h3 className="font-heading font-bold text-base" style={{ color: "var(--color-navy)" }}>
                {m.title}
              </h3>
              {m.title_ar && (
                <p className="arabic-text text-sm" style={{ color: "var(--color-gold-dark)" }}>{m.title_ar}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {m.hijri_date} · {format(parseISO(m.gregorian_date), "EEEE, d MMMM yyyy")}
              </p>
              {m.description && <p className="text-xs text-gray-500 mt-1">{m.description}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[m.category]}`}>
              {m.category}
            </span>
            {(isFuture(parseISO(m.gregorian_date)) || isToday(parseISO(m.gregorian_date))) && highlight && (
              <span className="status-upcoming text-xs">Upcoming</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="py-12 px-4" style={{ background: "var(--color-navy)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="h-1 w-12 rounded mb-4" style={{ background: "var(--color-gold)" }} />
          <h1 className="font-heading font-bold text-3xl text-white mb-2">Miqaat Calendar</h1>
          <p className="text-white/60">
            Upcoming ayyam, eid, urus and important Hijri dates for mumeeneen
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(CATEGORY_COLORS).map(([cat, cls]) => (
            <span key={cat} className={`text-xs px-3 py-1 rounded-full border font-medium capitalize ${cls}`}>
              {cat}
            </span>
          ))}
        </div>

        {/* Upcoming */}
        <div>
          <h2 className="section-heading text-xl mb-4">Upcoming Miqaat</h2>
          {upcoming.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No upcoming miqaat dates.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((m, i) => (
                <MiqaatCard key={m.id} m={m} highlight={i === 0} />
              ))}
            </div>
          )}
        </div>

        {/* Past */}
        {past.length > 0 && (
          <div>
            <h2 className="section-heading text-xl mb-4 text-gray-400">Past Miqaat</h2>
            <div className="space-y-3 opacity-60">
              {past.map((m) => <MiqaatCard key={m.id} m={m} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
