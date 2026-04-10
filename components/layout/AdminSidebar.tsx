"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Star, Users, BookMarked,
  CalendarDays, UtensilsCrossed, MessageSquare,
  CalendarCheck, LogOut, Megaphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = [
  { label: "Dashboard",  href: "/admin",           icon: LayoutDashboard },
  { label: "Ashara",     href: "/admin/ashara",     icon: Star },
  { label: "Bookings",   href: "/admin/bookings",   icon: CalendarCheck },
  { label: "Madrasa",    href: "/admin/madrasa",    icon: BookMarked },
  { label: "FMB Menu",   href: "/admin/fmb",        icon: UtensilsCrossed },
  { label: "Events",     href: "/admin/events",     icon: CalendarDays },
  { label: "Umoors",     href: "/admin/umoors",     icon: Users },
  { label: "Messages",       href: "/admin/messages",       icon: MessageSquare },
  { label: "Announcements",  href: "/admin/announcements",  icon: Megaphone },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="w-56 min-h-screen flex flex-col"
      style={{ background: "var(--color-navy)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/" className="block">
          <p className="font-heading font-bold text-white text-sm leading-tight">Jamaat Khadki</p>
          <p className="text-xs" style={{ color: "var(--color-gold-light)" }}>Admin Panel</p>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const Icon    = item.icon;
          const active  = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "text-white"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
              style={active ? { background: "rgba(207,155,0,0.2)", color: "var(--color-gold-light)" } : {}}>
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
