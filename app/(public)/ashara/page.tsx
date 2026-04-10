import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import CountdownTimer from "@/components/ashara/CountdownTimer";
import ProgramSchedule from "@/components/ashara/ProgramSchedule";
import PreparationSection from "@/components/ashara/PreparationSection";
import LiveUpdatesFeed from "@/components/ashara/LiveUpdatesFeed";
import { MapPin, Calendar, Clock, Download, Archive } from "lucide-react";
import { AsharaConfig, AsharaScheduleDay, AsharaUpdate, AsharaPreparation } from "@/types";

export const metadata: Metadata = {
  title: "Ashara Mubaraka 1448H",
  description:
    "Ashara Mubaraka 1448H — Khadki, Pune. Live countdown, schedule, preparations and updates.",
};

export const revalidate = 60;

async function getAsharaData() {
  const supabase = await createClient();

  const [configRes, scheduleRes, updatesRes, prepsRes, archiveRes] = await Promise.all([
    supabase.from("ashara_config").select("*").eq("year", 1448).single(),
    supabase.from("ashara_schedule").select("*").order("day_number"),
    supabase.from("ashara_updates")
      .select("*")
      .order("pinned", { ascending: false })
      .order("posted_at", { ascending: false }),
    supabase.from("ashara_preparations").select("*").order("display_order"),
    supabase.from("ashara_config").select("*").eq("year", 1447).single(),
  ]);

  // Filter schedule for 1448H
  const config1448 = configRes.data as AsharaConfig | null;
  const schedule = (scheduleRes.data || []).filter(
    (s: AsharaScheduleDay) => s.ashara_config_id === config1448?.id
  );
  const updates = (updatesRes.data || []).filter(
    (u: AsharaUpdate) => u.ashara_config_id === config1448?.id
  );
  const preparations = (prepsRes.data || []).filter(
    (p: AsharaPreparation) => p.ashara_config_id === config1448?.id
  );

  return {
    config: config1448,
    schedule,
    updates,
    preparations,
    archiveConfig: archiveRes.data as AsharaConfig | null,
  };
}

export default async function AsharaPage() {
  const { config, schedule, updates, preparations, archiveConfig } = await getAsharaData();

  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative py-20 px-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--color-navy) 0%, #243660 60%, #1a2744 100%)" }}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5"
          style={{ background: "var(--color-gold)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5"
          style={{ background: "var(--color-gold)", transform: "translate(-30%, 30%)" }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="bismillah mb-4">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="status-live">● LIVE COUNTDOWN</span>
          </div>

          <h1 className="font-heading font-bold text-3xl md:text-5xl text-white mb-2">
            Ashara Mubaraka <span style={{ color: "var(--color-gold-light)" }}>1448H</span>
          </h1>
          <p className="text-white/70 text-lg mb-2">Muharram 1–10, 1448H · June 17–26, 2026</p>

          {config && (
            <div className="flex items-center justify-center gap-2 text-white/60 text-sm mb-8">
              <MapPin className="w-4 h-4" style={{ color: "var(--color-gold-light)" }} />
              <span>{config.venue_name}, {config.location}</span>
            </div>
          )}

          <CountdownTimer />

          <p className="mt-8 text-white/50 text-xs">
            Countdown to Muharram 1, 1448H · Wednesday, 17 June 2026 · IST
          </p>
        </div>
      </section>

      {/* Gold bar */}
      <div className="h-1.5" style={{ background: "linear-gradient(90deg, var(--color-gold), var(--color-gold-light), var(--color-gold))" }} />

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <Tabs defaultValue="info">
          <TabsList className="flex flex-wrap gap-1 h-auto mb-8 bg-white border p-1 rounded-xl"
            style={{ borderColor: "rgba(207,155,0,0.2)" }}>
            {[
              { value: "info",        label: "Info & Venue" },
              { value: "schedule",    label: "Schedule" },
              { value: "preparation", label: "Preparation" },
              { value: "updates",     label: `Updates ${updates.length > 0 ? `(${updates.length})` : ""}` },
              { value: "past",        label: "Past Ashara (1447H)" },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}
                className="rounded-lg text-sm data-[state=active]:text-white data-[state=active]:shadow-none"
                style={{ "--tw-bg-opacity": "1" } as React.CSSProperties}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Info & Venue */}
          <TabsContent value="info">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Venue card */}
              <div className="rounded-xl border bg-white p-6"
                style={{ borderColor: "rgba(207,155,0,0.2)" }}>
                <h2 className="section-heading text-xl mb-4">Venue Details</h2>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex gap-3">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--color-gold)" }} />
                    <div>
                      <p className="font-medium text-gray-900">{config?.venue_name || "Khadki Bohra Masjid Complex"}</p>
                      <p>{config?.venue_address || "Camp, Khadki, Pune - 411003"}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Calendar className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--color-gold)" }} />
                    <div>
                      <p className="font-medium text-gray-900">Dates</p>
                      <p>June 17 – June 26, 2026 (Muharram 1–10, 1448H)</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--color-gold)" }} />
                    <div>
                      <p className="font-medium text-gray-900">Waaz Time</p>
                      <p>After Zohr-Asr namaaz (confirmed schedule posted soon)</p>
                    </div>
                  </div>
                </div>
                {config?.google_maps_url && (
                  <a href={config.google_maps_url} target="_blank" rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white transition-colors"
                    style={{ background: "var(--color-navy)" }}>
                    <MapPin className="w-4 h-4" /> View on Maps
                  </a>
                )}
              </div>

              {/* Maps embed placeholder */}
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(207,155,0,0.2)", minHeight: "280px" }}>
                <iframe
                  src="https://maps.google.com/maps?q=Khadki+Pune&output=embed"
                  className="w-full h-full min-h-[280px]"
                  loading="lazy"
                  title="Khadki Pune Map"
                />
              </div>
            </div>

            {/* Downloads */}
            <div className="mt-6 p-5 rounded-xl border bg-amber-50"
              style={{ borderColor: "rgba(207,155,0,0.3)" }}>
              <h3 className="font-heading font-semibold mb-3" style={{ color: "var(--color-navy)" }}>
                Downloads
              </h3>
              <div className="flex flex-wrap gap-3">
                {[
                  "Parking Map PDF",
                  "Venue Layout PDF",
                  "Emergency Contacts",
                ].map((d) => (
                  <button key={d}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border shadow-sm hover:shadow-md transition-all"
                    style={{ borderColor: "rgba(207,155,0,0.3)", color: "var(--color-navy)" }}>
                    <Download className="w-4 h-4" style={{ color: "var(--color-gold)" }} />
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Files will be available closer to Ashara.</p>
            </div>
          </TabsContent>

          {/* Schedule */}
          <TabsContent value="schedule">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading text-xl">10-Day Program Schedule</h2>
              <Badge variant="outline" className="text-xs">Muharram 1–10, 1448H</Badge>
            </div>
            <ProgramSchedule schedule={schedule} />
            <p className="text-xs text-gray-400 mt-3">* Times are approximate. Final schedule will be announced by jamaat.</p>
          </TabsContent>

          {/* Preparation */}
          <TabsContent value="preparation">
            <h2 className="section-heading text-xl mb-6">Preparation Guide</h2>
            <PreparationSection preparations={preparations} />
          </TabsContent>

          {/* Updates */}
          <TabsContent value="updates">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading text-xl">Live Updates</h2>
              {updates.length > 0 && (
                <span className="text-xs text-gray-400">{updates.length} update{updates.length !== 1 ? "s" : ""}</span>
              )}
            </div>
            <LiveUpdatesFeed updates={updates} />
          </TabsContent>

          {/* Past Ashara */}
          <TabsContent value="past">
            <div className="flex items-center gap-3 mb-6">
              <Archive className="w-5 h-5" style={{ color: "var(--color-gold)" }} />
              <h2 className="section-heading text-xl">Ashara 1447H — Archive</h2>
              <span className="status-completed">Completed</span>
            </div>
            {archiveConfig ? (
              <div className="rounded-xl border bg-white p-6"
                style={{ borderColor: "rgba(207,155,0,0.15)" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
                  <div>
                    <p className="text-gray-500">Year</p>
                    <p className="font-semibold" style={{ color: "var(--color-navy)" }}>Ashara Mubaraka 1447H</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-semibold" style={{ color: "var(--color-navy)" }}>{archiveConfig.location}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Dates</p>
                    <p className="font-semibold" style={{ color: "var(--color-navy)" }}>
                      June 27 – July 6, 2025 (Muharram 1–10, 1447H)
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Venue</p>
                    <p className="font-semibold" style={{ color: "var(--color-navy)" }}>{archiveConfig.venue_name}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                  Gallery and recordings from Ashara 1447H will be added here.
                  Contact jamaat admins to submit photos.
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Archive not available.</p>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
