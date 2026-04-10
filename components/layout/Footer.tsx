"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const footerLinks = {
  "Quick Links": [
    { label: "Ashara 1448H", href: "/ashara" },
    { label: "Bookings", href: "/bookings/sanitarium" },
    { label: "FMB Menu", href: "/fmb" },
    { label: "Miqaat Calendar", href: "/miqaat" },
    { label: "Events", href: "/events" },
  ],
  "Portals": [
    { label: "12 Umoors", href: "/umoors" },
    { label: "Madrasa Portal", href: "/madrasa" },
    { label: "Fakri Hall", href: "/bookings/halls?hall=fakri" },
    { label: "Shujai Hall", href: "/bookings/halls?hall=shujai" },
    { label: "Send Message", href: "/messages" },
  ],
  "Info": [
    { label: "About Khadki", href: "/about" },
    { label: "Contacts", href: "/contacts" },
    { label: "Admin Login", href: "/admin" },
  ],
};

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/sehat")) return null;
  return (
    <footer style={{ background: "var(--color-navy)" }} className="text-white mt-auto">
      {/* Gold bar */}
      <div className="h-1" style={{ background: "linear-gradient(90deg, var(--color-gold), var(--color-gold-light), var(--color-gold))" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="bismillah text-xl mb-3">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>
            <h3 className="font-heading font-bold text-lg text-white mb-2">Jamaat Khadki, Pune</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Official community portal for Dawoodi Bohra Jamaat, Khadki, Pune.
              Serving mumeeneen of Khadki and surrounding areas.
            </p>
            <p className="mt-3 text-sm" style={{ color: "var(--color-gold-light)" }}>
              Under the guidance of His Holiness<br />
              Syedna Mufaddal Saifuddin TUS<br />
              53rd Al-Dai Al-Mutlaq
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-heading font-semibold mb-4" style={{ color: "var(--color-gold-light)" }}>{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/40 text-xs">
            © {new Date().getFullYear()} Jamaat Khadki, Pune. All rights reserved.
          </p>
          <p className="text-white/40 text-xs arabic-text" style={{ fontSize: "14px" }}>
            اللهم صل على محمد وآل محمد
          </p>
        </div>
      </div>
    </footer>
  );
}
