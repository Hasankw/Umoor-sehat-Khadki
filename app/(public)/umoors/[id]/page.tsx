import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Umoor, Event } from "@/types";
import { Phone, Mail, MessageSquare, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `${id.charAt(0).toUpperCase() + id.slice(1)} Umoor — Khadki Jamaat` };
}

export const revalidate = 3600;

export default async function UmoorDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: umoors } = await supabase.from("umoors").select("*");
  const umoor = (umoors || []).find(
    (u: Umoor) => u.name.toLowerCase().replace(/\s+/g, "-") === id
  ) as Umoor | undefined;

  if (!umoor) notFound();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("umoor_id", umoor.id)
    .gte("event_date", today)
    .order("event_date")
    .limit(5);

  return (
    <div className="min-h-screen bg-cream">
      <div className="py-12 px-4" style={{ background: "var(--color-navy)" }}>
        <div className="max-w-4xl mx-auto">
          <Link href="/umoors" className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Umoors
          </Link>
          <div className="h-1 w-12 rounded mb-4" style={{ background: "var(--color-gold)" }} />
          <h1 className="font-heading font-bold text-3xl text-white mb-1">{umoor.name}</h1>
          {umoor.name_ar && (
            <p className="arabic-text text-xl" style={{ color: "var(--color-gold-light)" }}>{umoor.name_ar}</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white p-6" style={{ borderColor: "rgba(207,155,0,0.2)" }}>
            <h2 className="section-heading text-xl mb-3">About</h2>
            <p className="text-gray-600 leading-relaxed">{umoor.description}</p>
          </div>

          {(events || []).length > 0 && (
            <div className="rounded-xl border bg-white p-6" style={{ borderColor: "rgba(207,155,0,0.2)" }}>
              <h2 className="section-heading text-xl mb-4">Upcoming Events</h2>
              <div className="space-y-3">
                {(events as Event[]).map((e) => (
                  <div key={e.id} className="flex gap-3 p-3 rounded-lg"
                    style={{ background: "rgba(207,155,0,0.04)", border: "1px solid rgba(207,155,0,0.1)" }}>
                    <Calendar className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--color-gold)" }} />
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--color-navy)" }}>{e.title}</p>
                      <p className="text-xs text-gray-400">
                        {format(parseISO(e.event_date), "EEE, d MMM yyyy")}
                        {e.location && ` · ${e.location}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {(umoor.contact_name || umoor.contact_phone || umoor.contact_email) && (
            <div className="rounded-xl border bg-white p-5" style={{ borderColor: "rgba(207,155,0,0.2)" }}>
              <h3 className="font-heading font-semibold mb-3" style={{ color: "var(--color-navy)" }}>Contact</h3>
              <div className="space-y-2 text-sm">
                {umoor.contact_name && <p className="font-medium">{umoor.contact_name}</p>}
                {umoor.contact_phone && (
                  <a href={`tel:${umoor.contact_phone}`}
                    className="flex items-center gap-2 hover:underline" style={{ color: "var(--color-gold-dark)" }}>
                    <Phone className="w-3.5 h-3.5" />{umoor.contact_phone}
                  </a>
                )}
                {umoor.contact_phone && (
                  <a href={`https://wa.me/${umoor.contact_phone.replace(/\D/g, "")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:underline text-xs">
                    WhatsApp →
                  </a>
                )}
                {umoor.contact_email && (
                  <a href={`mailto:${umoor.contact_email}`}
                    className="flex items-center gap-2 hover:underline text-gray-600">
                    <Mail className="w-3.5 h-3.5" />{umoor.contact_email}
                  </a>
                )}
              </div>
            </div>
          )}

          <Link href={`/messages?umoor=${umoor.id}`}
            className="flex items-center gap-3 rounded-xl border p-5 hover:shadow-md transition-all"
            style={{ borderColor: "rgba(207,155,0,0.2)", background: "white" }}>
            <MessageSquare className="w-5 h-5" style={{ color: "var(--color-gold)" }} />
            <div>
              <p className="font-medium text-sm" style={{ color: "var(--color-navy)" }}>Send Message</p>
              <p className="text-xs text-gray-400">Contact this umoor</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
