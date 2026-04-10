import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Event, Umoor } from "@/types";
import { format, parseISO } from "date-fns";
import { Calendar, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Events — Khadki Jamaat",
  description: "Upcoming community events in Khadki Dawoodi Bohra Jamaat.",
};

export const revalidate = 300;

export default async function EventsPage() {
  const supabase = await createClient();
  const today    = new Date().toISOString().split("T")[0];

  const [upcomingRes, pastRes] = await Promise.all([
    supabase.from("events").select("*, umoor:umoors(name)").gte("event_date", today).eq("is_public", true).order("event_date").limit(20),
    supabase.from("events").select("*, umoor:umoors(name)").lt("event_date", today).eq("is_public", true).order("event_date", { ascending: false }).limit(6),
  ]);

  const upcoming = (upcomingRes.data || []) as (Event & { umoor: Pick<Umoor, "name"> | null })[];
  const past     = (pastRes.data     || []) as (Event & { umoor: Pick<Umoor, "name"> | null })[];

  function EventCard({ event, muted = false }: { event: typeof upcoming[0]; muted?: boolean }) {
    return (
      <div className={`rounded-xl border bg-white overflow-hidden flex gap-0 ${muted ? "opacity-60" : ""}`}
        style={{ borderColor: "rgba(207,155,0,0.15)" }}>
        {/* Date column */}
        <div className="w-16 flex flex-col items-center justify-center py-4 shrink-0 text-white"
          style={{ background: "var(--color-navy)" }}>
          <span className="text-xs font-bold">{format(parseISO(event.event_date), "MMM").toUpperCase()}</span>
          <span className="text-3xl font-bold leading-tight">{format(parseISO(event.event_date), "d")}</span>
          <span className="text-xs text-white/60">{format(parseISO(event.event_date), "yyyy")}</span>
        </div>
        {/* Content */}
        <div className="p-4 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className="font-heading font-bold text-base" style={{ color: "var(--color-navy)" }}>
              {event.title}
            </h3>
            {event.umoor && (
              <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                style={{ background: "rgba(207,155,0,0.1)", color: "var(--color-gold-dark)" }}>
                {event.umoor.name}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
            {event.event_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />{event.event_time}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />{event.location}
              </span>
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
          <h1 className="font-heading font-bold text-3xl text-white mb-2">Upcoming Events</h1>
          <p className="text-white/60">Community events and programmes by Khadki Jamaat</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        <div>
          {upcoming.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No upcoming events. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </div>
        {past.length > 0 && (
          <div>
            <h2 className="section-heading text-lg mb-4 text-gray-400">Past Events</h2>
            <div className="space-y-3">
              {past.map((e) => <EventCard key={e.id} event={e} muted />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
