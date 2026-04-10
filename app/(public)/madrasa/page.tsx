import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { MadrasaActivity } from "@/types";
import { BookMarked, LogIn, Calendar, Image as ImageIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

export const metadata: Metadata = {
  title: "Madrasa — Khadki Jamaat",
  description: "Khadki Bohra Madrasa — enrollment, schedule and student portal.",
};

export const revalidate = 3600;

export default async function MadrasaPage() {
  const supabase = await createClient();
  const { data: activities } = await supabase
    .from("madrasa_activities")
    .select("*")
    .order("date", { ascending: false })
    .limit(4);

  return (
    <div className="min-h-screen bg-cream">
      <div className="py-12 px-4" style={{ background: "var(--color-navy)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="h-1 w-12 rounded mb-4" style={{ background: "var(--color-gold)" }} />
          <h1 className="font-heading font-bold text-3xl text-white mb-2">Madrasa</h1>
          <p className="text-white/60">Khadki Dawoodi Bohra Madrasa — Deeni and Academic Education</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* About */}
        <div className="rounded-xl border bg-white p-6" style={{ borderColor: "rgba(207,155,0,0.2)" }}>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl shrink-0" style={{ background: "var(--color-navy)" }}>
              <BookMarked className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="section-heading text-xl mb-2">About Khadki Madrasa</h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                The Khadki Dawoodi Bohra Madrasa provides comprehensive deeni (religious) and secular education
                to children of the jamaat. Under the guidance of qualified muallimeen, students learn
                Quran, Lisaani, Islamic history, and academic subjects. Classes are held on weekends
                and during vacation periods.
              </p>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Class Schedule", body: "Weekend classes: Saturday 9am–12pm, Sunday 9am–11am", icon: Calendar },
            { title: "Enrollment", body: "Open for children aged 5–16. Contact Deeni Talim umoor for admission.", icon: BookMarked },
            { title: "Contact", body: "Contact Deeni Talim umoor via the contact page or send a message.", icon: LogIn },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="rounded-xl border bg-white p-5"
                style={{ borderColor: "rgba(207,155,0,0.15)" }}>
                <Icon className="w-5 h-5 mb-3" style={{ color: "var(--color-gold)" }} />
                <h3 className="font-heading font-semibold text-sm mb-1" style={{ color: "var(--color-navy)" }}>
                  {c.title}
                </h3>
                <p className="text-xs text-gray-500">{c.body}</p>
              </div>
            );
          })}
        </div>

        {/* Student portal CTA */}
        <div className="rounded-xl border p-6 flex items-center justify-between gap-4 flex-wrap"
          style={{ background: "rgba(207,155,0,0.06)", borderColor: "rgba(207,155,0,0.3)" }}>
          <div>
            <h3 className="font-heading font-bold text-lg" style={{ color: "var(--color-navy)" }}>
              Student / Guardian Portal
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Login with your ITS ID to view attendance, exam results and activities for your child.
            </p>
          </div>
          <Link href="/madrasa/portal"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0 transition-all hover:scale-105"
            style={{ background: "var(--color-navy)" }}>
            <LogIn className="w-4 h-4" /> Login to Portal
          </Link>
        </div>

        {/* Recent activities */}
        {(activities || []).length > 0 && (
          <div>
            <h2 className="section-heading text-xl mb-4">Recent Activities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(activities as MadrasaActivity[]).map((a) => (
                <div key={a.id} className="rounded-xl border bg-white overflow-hidden"
                  style={{ borderColor: "rgba(207,155,0,0.15)" }}>
                  {a.image_url ? (
                    <Image src={a.image_url} alt={a.title} width={400} height={160} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center"
                      style={{ background: "rgba(207,155,0,0.05)" }}>
                      <ImageIcon className="w-8 h-8 text-gray-200" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-heading font-semibold text-sm" style={{ color: "var(--color-navy)" }}>
                      {a.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(parseISO(a.date), "d MMMM yyyy")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
