import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CountdownTimer from "@/components/ashara/CountdownTimer";
import AnnouncementTicker from "@/components/home/AnnouncementTicker";
import QuickLinks from "@/components/home/QuickLinks";
import { MapPin, ArrowRight, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Announcement, Event, MiqaatDate } from "@/types";

export const metadata: Metadata = {
  title: "Jamaat Khadki Pune — Dawoodi Bohra Community Portal",
};

export const revalidate = 60;

async function getHomeData() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const [announcementsRes, eventsRes, miqaatRes] = await Promise.all([
    supabase.from("announcements")
      .select("*")
      .eq("active", true)
      .or(`expires_at.is.null,expires_at.gte.${today}`)
      .order("priority", { ascending: false })
      .limit(5),
    supabase.from("events")
      .select("*, umoor:umoors(name)")
      .gte("event_date", today)
      .eq("is_public", true)
      .order("event_date")
      .limit(3),
    supabase.from("miqaat_dates")
      .select("*")
      .gte("gregorian_date", today)
      .order("gregorian_date")
      .limit(3),
  ]);

  return {
    announcements: (announcementsRes.data || []) as Announcement[],
    events: (eventsRes.data || []) as Event[],
    miqaat: (miqaatRes.data || []) as MiqaatDate[],
  };
}

export default async function HomePage() {
  const { announcements, events, miqaat } = await getHomeData();

  return (
    <div className="min-h-screen">
      {/* ── Announcement Ticker ─────────────────────────────────────────── */}
      <AnnouncementTicker announcements={announcements} />

      {/* ── Hero — Ashara 1448H Countdown ───────────────────────────────── */}
      <section
        className="relative py-24 px-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--color-navy) 0%, #1e3060 50%, var(--color-navy) 100%)" }}>
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 25% 25%, var(--color-gold) 0%, transparent 50%), radial-gradient(circle at 75% 75%, var(--color-gold) 0%, transparent 50%)" }} />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="bismillah text-3xl mb-3">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(207,155,0,0.2)", color: "var(--color-gold-light)", border: "1px solid rgba(207,155,0,0.3)" }}>
            ● Ashara Mubaraka 1448H · Khadki, Pune
          </div>

          <h1 className="font-heading font-bold text-4xl md:text-6xl text-white mb-4 leading-tight">
            Jamaat Khadki<br />
            <span style={{ color: "var(--color-gold-light)" }}>Pune</span>
          </h1>
          <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto">
            Official community portal for Dawoodi Bohra Jamaat, Khadki.
            Ashara 1448H countdown · Services · Bookings · Madrasa · Events
          </p>

          {/* Live Countdown */}
          <div className="mb-8">
            <p className="text-white/50 text-sm uppercase tracking-widest mb-4">
              Countdown to Ashara Mubaraka 1448H
            </p>
            <CountdownTimer />
            <p className="text-white/40 text-xs mt-4">
              Muharram 1, 1448H · Wednesday, June 17, 2026 · Khadki, Pune
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/ashara"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
              style={{ background: "var(--color-gold)", boxShadow: "0 4px 20px rgba(207,155,0,0.4)" }}>
              Ashara Portal <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/bookings/sanitarium"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.3)", color: "white" }}>
              Book Facility
            </Link>
          </div>
        </div>
      </section>

      {/* Gold accent bar */}
      <div className="h-1.5" style={{ background: "linear-gradient(90deg, var(--color-gold), var(--color-gold-light), var(--color-gold))" }} />

      {/* ── Quick Links ─────────────────────────────────────────────────── */}
      <QuickLinks />

      {/* ── Events + Miqaat ─────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-cream">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* Upcoming Events */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="section-heading text-2xl">Upcoming Events</h2>
              <Link href="/events" className="text-sm font-medium hover:underline"
                style={{ color: "var(--color-gold-dark)" }}>
                View all →
              </Link>
            </div>
            <div className="gold-divider mb-5" />
            {events.length === 0 ? (
              <p className="text-gray-400 text-sm">No upcoming events. Check back soon.</p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Link key={event.id} href="/events"
                    className="flex gap-4 bg-white rounded-xl border p-4 hover:shadow-md transition-all"
                    style={{ borderColor: "rgba(207,155,0,0.15)" }}>
                    <div className="w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 text-white"
                      style={{ background: "var(--color-navy)" }}>
                      <span className="text-xs font-bold leading-none">
                        {format(parseISO(event.event_date), "MMM").toUpperCase()}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {format(parseISO(event.event_date), "d")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-sm line-clamp-1"
                        style={{ color: "var(--color-navy)" }}>{event.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        {event.event_time && <><Clock className="w-3 h-3" />{event.event_time}</>}
                        {event.location && <><MapPin className="w-3 h-3" />{event.location}</>}
                      </p>
                      {event.umoor && (
                        <span className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(207,155,0,0.1)", color: "var(--color-gold-dark)" }}>
                          {(event.umoor as {name: string}).name}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Miqaat */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="section-heading text-2xl">Upcoming Miqaat</h2>
              <Link href="/miqaat" className="text-sm font-medium hover:underline"
                style={{ color: "var(--color-gold-dark)" }}>
                Full calendar →
              </Link>
            </div>
            <div className="gold-divider mb-5" />
            {miqaat.length === 0 ? (
              <p className="text-gray-400 text-sm">No upcoming miqaat dates found.</p>
            ) : (
              <div className="space-y-3">
                {miqaat.map((m) => (
                  <div key={m.id}
                    className="flex gap-4 bg-white rounded-xl border p-4"
                    style={{ borderColor: "rgba(207,155,0,0.15)" }}>
                    <div className="w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0"
                      style={{ background: "rgba(207,155,0,0.1)", border: "1px solid rgba(207,155,0,0.3)" }}>
                      <span className="text-xs font-bold leading-none" style={{ color: "var(--color-gold-dark)" }}>
                        {format(parseISO(m.gregorian_date), "MMM").toUpperCase()}
                      </span>
                      <span className="text-lg font-bold leading-none" style={{ color: "var(--color-navy)" }}>
                        {format(parseISO(m.gregorian_date), "d")}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-sm"
                        style={{ color: "var(--color-navy)" }}>{m.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {m.hijri_date} · {format(parseISO(m.gregorian_date), "EEEE, d MMMM yyyy")}
                      </p>
                      {m.title_ar && (
                        <p className="arabic-text text-xs mt-0.5" style={{ color: "var(--color-gold-dark)" }}>{m.title_ar}</p>
                      )}
                    </div>
                    <span className={`self-start text-xs px-2 py-0.5 rounded-full status-${m.category === "eid" ? "live" : "upcoming"}`}>
                      {m.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── About Banner ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4"
        style={{ background: "var(--color-navy)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="bismillah text-2xl mb-4">اللهم صل على محمد وآل محمد</p>
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-white mb-4">
            Jamaat Khadki, Pune
          </h2>
          <p className="text-white/60 text-base mb-6 max-w-2xl mx-auto leading-relaxed">
            Khadki is home to one of the oldest Dawoodi Bohra communities in Pune. Under the blessed
            guidance of His Holiness Syedna Mufaddal Saifuddin TUS, the jamaat strives in all aspects
            of communal life — from education and welfare to trade and religious observance.
          </p>
          <Link href="/about"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
            style={{ background: "var(--color-gold)", color: "white", boxShadow: "0 4px 20px rgba(207,155,0,0.3)" }}>
            About Khadki Jamaat <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
