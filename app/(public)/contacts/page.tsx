import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Umoor } from "@/types";
import { Phone, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contacts — Khadki Jamaat",
  description: "Contact numbers and details for Khadki Dawoodi Bohra Jamaat.",
};

export const revalidate = 3600;

const EMERGENCY_CONTACTS = [
  { name: "Jamaat Emergency",         phone: "+91-XXXXX-XXXXX", role: "24/7 Emergency" },
  { name: "Sanitarium Reception",     phone: "+91-XXXXX-XXXXX", role: "Sanitarium" },
  { name: "Hall Booking Office",      phone: "+91-XXXXX-XXXXX", role: "Hall Bookings" },
  { name: "Ashara Coordination 1448H",phone: "+91-XXXXX-XXXXX", role: "Ashara 1448H" },
];

const LEADERSHIP = [
  { name: "Amil Saheb",    role: "Amil — Khadki Jamaat",  phone: "+91-XXXXX-XXXXX", email: "" },
  { name: "Nazir Saheb",   role: "Nazir",                  phone: "+91-XXXXX-XXXXX", email: "" },
];

function ContactCard({ name, role, phone, email, whatsapp = true }: {
  name: string; role: string; phone: string; email?: string; whatsapp?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-white p-4"
      style={{ borderColor: "rgba(207,155,0,0.15)" }}>
      <p className="font-heading font-semibold text-sm" style={{ color: "var(--color-navy)" }}>{name}</p>
      <p className="text-xs text-gray-400 mb-2">{role}</p>
      {phone && (
        <div className="flex items-center gap-3">
          <a href={`tel:${phone}`}
            className="flex items-center gap-1.5 text-sm font-medium hover:underline"
            style={{ color: "var(--color-gold-dark)" }}>
            <Phone className="w-3.5 h-3.5" />{phone}
          </a>
          {whatsapp && (
            <a href={`https://wa.me/${phone.replace(/\D/g, "")}`}
              target="_blank" rel="noopener noreferrer"
              className="text-xs text-green-600 hover:underline flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />WA
            </a>
          )}
        </div>
      )}
      {email && (
        <a href={`mailto:${email}`}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:underline mt-1">
          <Mail className="w-3 h-3" />{email}
        </a>
      )}
    </div>
  );
}

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("umoors")
    .select("id, name, name_ar, contact_name, contact_phone, contact_email, display_order")
    .order("display_order");

  const umoors = (data || []) as Umoor[];

  return (
    <div className="min-h-screen bg-cream">
      <div className="py-12 px-4" style={{ background: "var(--color-navy)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="h-1 w-12 rounded mb-4" style={{ background: "var(--color-gold)" }} />
          <h1 className="font-heading font-bold text-3xl text-white mb-2">Contacts</h1>
          <p className="text-white/60">Get in touch with Khadki Jamaat leadership and departments</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Leadership */}
        <div>
          <h2 className="section-heading text-xl mb-4">Jamaat Leadership</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LEADERSHIP.map((l) => (
              <ContactCard key={l.name} {...l} />
            ))}
          </div>
        </div>

        {/* Emergency */}
        <div>
          <h2 className="section-heading text-xl mb-4">Important Numbers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EMERGENCY_CONTACTS.map((c) => (
              <ContactCard key={c.name} name={c.name} role={c.role} phone={c.phone} />
            ))}
          </div>
        </div>

        {/* 12 Umoors */}
        <div>
          <h2 className="section-heading text-xl mb-4">12 Umoors — Contact Directory</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {umoors.filter((u) => u.contact_phone || u.contact_email).map((u) => (
              <ContactCard
                key={u.id}
                name={u.contact_name || u.name}
                role={u.name}
                phone={u.contact_phone}
                email={u.contact_email}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl border p-6 text-center"
          style={{ background: "rgba(207,155,0,0.06)", borderColor: "rgba(207,155,0,0.3)" }}>
          <p className="font-heading font-semibold text-lg mb-2" style={{ color: "var(--color-navy)" }}>
            Need to send a message?
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Use the message portal to reach any umoor coordinator directly.
          </p>
          <Link href="/messages"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: "var(--color-navy)" }}>
            <MessageSquare className="w-4 h-4" /> Send Message
          </Link>
        </div>
      </div>
    </div>
  );
}
