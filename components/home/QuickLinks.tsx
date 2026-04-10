import Link from "next/link";
import {
  BookOpen, Sparkles, Briefcase, HeartPulse, Building2,
  HandHeart, GraduationCap, TreePine, Users, Settings,
  BookMarked as MosqueIcon, UsersRound, Star, Calendar, Home, MessageSquare,
  UtensilsCrossed, BookMarked,
} from "lucide-react";

const UMOOR_LINKS = [
  { name: "Talim",       icon: BookOpen,      href: "/umoors/talim",      color: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "Taharat",     icon: Sparkles,      href: "/umoors/taharat",    color: "bg-green-50 text-green-700 border-green-200" },
  { name: "Tijarat",     icon: Briefcase,     href: "/umoors/tijarat",    color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { name: "Sehhat",      icon: HeartPulse,    href: "/umoors/sehhat",     color: "bg-red-50 text-red-700 border-red-200" },
  { name: "Imarat",      icon: Building2,     href: "/umoors/imarat",     color: "bg-stone-50 text-stone-700 border-stone-200" },
  { name: "Iftitah",     icon: HandHeart,     href: "/umoors/iftitah",    color: "bg-pink-50 text-pink-700 border-pink-200" },
  { name: "Alam",        icon: GraduationCap, href: "/umoors/alam",       color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { name: "Bustan",      icon: TreePine,      href: "/umoors/bustan",     color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { name: "Khidmat",     icon: Users,         href: "/umoors/khidmat",    color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { name: "Nizam",       icon: Settings,      href: "/umoors/nizam",      color: "bg-slate-50 text-slate-700 border-slate-200" },
  { name: "Deeni Talim", icon: MosqueIcon,     href: "/umoors/deeni-talim",color: "bg-teal-50 text-teal-700 border-teal-200" },
  { name: "Khawateen",   icon: UsersRound,    href: "/umoors/khawateen",  color: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
];

const SERVICE_LINKS = [
  { name: "Ashara 1448H",  icon: Star,            href: "/ashara",                     highlight: true },
  { name: "FMB Menu",      icon: UtensilsCrossed, href: "/fmb",                        highlight: false },
  { name: "Madrasa",       icon: BookMarked,      href: "/madrasa",                    highlight: false },
  { name: "Sanitarium",    icon: Home,            href: "/bookings/sanitarium",        highlight: false },
  { name: "Hall Booking",  icon: Calendar,        href: "/bookings/halls",             highlight: false },
  { name: "Send Message",  icon: MessageSquare,   href: "/messages",                   highlight: false },
];

export default function QuickLinks() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Services */}
        <div className="mb-10">
          <h2 className="section-heading text-2xl mb-1">Community Services</h2>
          <div className="gold-divider mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {SERVICE_LINKS.map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.href} href={s.href}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all hover:shadow-md ${
                    s.highlight
                      ? "text-white border-amber-400"
                      : "bg-white border-gray-100 hover:border-amber-200"
                  }`}
                  style={s.highlight ? { background: "var(--color-navy)" } : {}}>
                  <div className={`p-2.5 rounded-lg ${s.highlight ? "bg-white/10" : "bg-amber-50"}`}>
                    <Icon className="w-5 h-5" style={{ color: s.highlight ? "var(--color-gold-light)" : "var(--color-gold)" }} />
                  </div>
                  <span className={`text-xs font-medium leading-tight ${s.highlight ? "text-white" : "text-gray-700"}`}>
                    {s.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 12 Umoors */}
        <div>
          <h2 className="section-heading text-2xl mb-1">12 Umoors</h2>
          <div className="gold-divider mb-6" />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {UMOOR_LINKS.map((u) => {
              const Icon = u.icon;
              return (
                <Link key={u.href} href={u.href}
                  className={`umoor-card flex flex-col items-center gap-2 p-3 text-center`}>
                  <div className={`p-2.5 rounded-lg border ${u.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 leading-tight">{u.name}</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <Link href="/umoors"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--color-gold-dark)" }}>
              View all 12 Umoors →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
