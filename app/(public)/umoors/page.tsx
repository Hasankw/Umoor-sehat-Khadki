import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Umoor } from "@/types";
import { Phone, Mail, ArrowRight } from "lucide-react";
import * as LucideIcons from "lucide-react";

export const metadata: Metadata = {
  title: "12 Umoors — Khadki Jamaat",
  description: "All 12 departments (umoors) of Khadki Dawoodi Bohra Jamaat.",
};

export const revalidate = 3600;

function UmoorIcon({ name }: { name: string }) {
  const iconName = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("") as keyof typeof LucideIcons;
  const Icon = (LucideIcons[iconName] as React.ComponentType<{ className?: string }>) ?? LucideIcons.Users;
  return <Icon className="w-7 h-7" />;
}

export default async function UmoorsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("umoors").select("*").order("display_order");
  const umoors = (data || []) as Umoor[];

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="py-12 px-4" style={{ background: "var(--color-navy)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="h-1 w-12 rounded mb-4" style={{ background: "var(--color-gold)" }} />
          <h1 className="font-heading font-bold text-3xl text-white mb-2">12 Umoors</h1>
          <p className="text-white/60">
            The 12 departments of Khadki Jamaat — each serving a unique aspect of community life
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {umoors.map((umoor) => (
            <Link key={umoor.id} href={`/umoors/${umoor.name.toLowerCase().replace(/\s+/g, "-")}`}
              className="umoor-card group">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl text-white shrink-0"
                  style={{ background: "var(--color-navy)" }}>
                  <UmoorIcon name={umoor.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-lg" style={{ color: "var(--color-navy)" }}>
                    {umoor.name}
                  </h3>
                  {umoor.name_ar && (
                    <p className="arabic-text text-sm" style={{ color: "var(--color-gold-dark)" }}>
                      {umoor.name_ar}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{umoor.description}</p>
              <div className="space-y-1.5 text-xs text-gray-500">
                {umoor.contact_name && (
                  <p className="font-medium text-gray-700">{umoor.contact_name}</p>
                )}
                {umoor.contact_phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    <a href={`tel:${umoor.contact_phone}`} className="hover:underline"
                      style={{ color: "var(--color-gold-dark)" }}>
                      {umoor.contact_phone}
                    </a>
                  </p>
                )}
                {umoor.contact_email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{umoor.contact_email}</span>
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium group-hover:underline"
                style={{ color: "var(--color-gold-dark)" }}>
                View details <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>

        {umoors.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p>Umoors data not loaded yet. Run Supabase migrations first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
