import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  CalendarCheck, MessageSquare, BookMarked, Users, Star,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin Dashboard — Khadki Jamaat" };

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name").eq("id", user.id).single();

  const adminRoles = ["super_admin", "umoor_admin", "madrasa_admin", "booking_admin"];
  if (!profile || !adminRoles.includes(profile.role)) redirect("/");

  // Stats
  const [bookingsRes, messagesRes, studentsRes] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact" }).eq("status", "pending"),
    supabase.from("messages").select("id", { count: "exact" }).eq("status", "new"),
    supabase.from("madrasa_students").select("id", { count: "exact" }).eq("active", true),
  ]);

  const stats = [
    { label: "Pending Bookings", value: bookingsRes.count ?? 0, icon: CalendarCheck, href: "/admin/bookings", color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
    { label: "New Messages",     value: messagesRes.count ?? 0, icon: MessageSquare, href: "/admin/messages", color: "bg-blue-50 border-blue-200 text-blue-800" },
    { label: "Active Students",  value: studentsRes.count ?? 0, icon: BookMarked,    href: "/admin/madrasa",  color: "bg-green-50 border-green-200 text-green-800" },
  ];

  const quickActions = [
    { label: "Ashara 1448H",  href: "/admin/ashara",   icon: Star,         desc: "Manage schedule & updates" },
    { label: "Bookings",      href: "/admin/bookings", icon: CalendarCheck, desc: "Approve/reject bookings" },
    { label: "FMB Menu",      href: "/admin/fmb",      icon: Users,        desc: "Post daily menu" },
    { label: "Messages",      href: "/admin/messages", icon: MessageSquare, desc: "Reply to messages" },
    { label: "Madrasa",       href: "/admin/madrasa",  icon: BookMarked,   desc: "Manage students" },
    { label: "Events",        href: "/admin/events",   icon: CalendarCheck, desc: "Add/edit events" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl" style={{ color: "var(--color-navy)" }}>
          Admin Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome, {profile.full_name} · {profile.role.replace("_", " ")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}
              className={`rounded-xl border p-5 flex items-center gap-4 hover:shadow-md transition-all ${s.color}`}>
              <Icon className="w-8 h-8 opacity-70" />
              <div>
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-sm font-medium">{s.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <h2 className="font-heading font-semibold text-lg mb-4" style={{ color: "var(--color-navy)" }}>
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.href} href={a.href}
              className="rounded-xl border bg-white p-5 hover:shadow-md transition-all"
              style={{ borderColor: "rgba(207,155,0,0.2)" }}>
              <div className="p-2.5 rounded-lg w-fit mb-3" style={{ background: "rgba(207,155,0,0.1)" }}>
                <Icon className="w-5 h-5" style={{ color: "var(--color-gold)" }} />
              </div>
              <p className="font-heading font-semibold text-sm" style={{ color: "var(--color-navy)" }}>
                {a.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
