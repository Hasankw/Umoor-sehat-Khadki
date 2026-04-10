"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";

const navItems = [
  { label: "Home", href: "/" },
  {
    label: "Ashara 1448H",
    href: "/ashara",
    highlight: true,
    children: [
      { label: "Countdown & Info", href: "/ashara" },
      { label: "Schedule", href: "/ashara#schedule" },
      { label: "Preparation", href: "/ashara#preparation" },
      { label: "Updates", href: "/ashara#updates" },
      { label: "Past Ashara (1447H)", href: "/ashara#past" },
    ],
  },
  {
    label: "12 Umoors",
    href: "/umoors",
    children: [
      { label: "All Umoors", href: "/umoors" },
      { label: "Talim", href: "/umoors/talim" },
      { label: "Sehhat", href: "/umoors/sehhat" },
      { label: "Imarat", href: "/umoors/imarat" },
      { label: "Bustan (Youth)", href: "/umoors/bustan" },
      { label: "Khawateen", href: "/umoors/khawateen" },
    ],
  },
  {
    label: "Madrasa",
    href: "/madrasa",
    children: [
      { label: "About Madrasa", href: "/madrasa" },
      { label: "Student Portal", href: "/madrasa/portal" },
    ],
  },
  {
    label: "Bookings",
    href: "/bookings/sanitarium",
    children: [
      { label: "Sanitarium", href: "/bookings/sanitarium" },
      { label: "Fakri Hall", href: "/bookings/halls?hall=fakri" },
      { label: "Shujai Hall", href: "/bookings/halls?hall=shujai" },
    ],
  },
  {
    label: "Services",
    href: "/fmb",
    children: [
      { label: "FMB Menu", href: "/fmb" },
      { label: "Miqaat Calendar", href: "/miqaat" },
      { label: "Events", href: "/events" },
      { label: "Contacts", href: "/contacts" },
      { label: "Send Message", href: "/messages" },
    ],
  },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  // Sehat section has its own standalone layout — hide main navbar
  if (pathname.startsWith("/sehat")) return null;

  return (
    <header className="sticky top-0 z-50 w-full shadow-md" style={{ background: "var(--color-navy)" }}>
      {/* Gold accent line */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--color-gold), var(--color-gold-light), var(--color-gold))" }} />

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-heading font-bold text-sm border-2"
              style={{ borderColor: "var(--color-gold)", background: "rgba(207,155,0,0.15)" }}>
              جماعت
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-heading font-bold text-sm leading-tight">Jamaat Khadki</div>
              <div className="text-xs leading-tight" style={{ color: "var(--color-gold-light)" }}>Khadki, Pune</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div key={item.href} className="relative group"
                onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.highlight
                      ? "font-semibold"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  } ${pathname === item.href ? "text-white bg-white/10" : ""}`}
                  style={item.highlight ? { color: "var(--color-gold-light)" } : {}}
                >
                  {item.label}
                  {item.children && <ChevronDown className="w-3 h-3" />}
                </Link>
                {item.children && openDropdown === item.label && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border py-2 z-50"
                    style={{ borderColor: "rgba(207,155,0,0.3)" }}>
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href}
                        className="block px-4 py-2 text-sm hover:bg-amber-50 transition-colors"
                        style={{ color: "var(--color-navy)" }}
                        onClick={() => setOpenDropdown(null)}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile toggle */}
          <button className="lg:hidden text-white p-2" onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-white" style={{ borderColor: "rgba(207,155,0,0.3)" }}>
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <div key={item.href}>
                <Link href={item.href}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: item.highlight ? "var(--color-gold)" : "var(--color-navy)" }}
                  onClick={() => {
                    if (!item.children) setMobileOpen(false);
                    else setOpenDropdown(openDropdown === item.label ? null : item.label);
                  }}>
                  <span>{item.label}</span>
                  {item.children && (
                    <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                  )}
                </Link>
                {item.children && openDropdown === item.label && (
                  <div className="ml-4 mt-1 space-y-1 pb-2">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href}
                        className="block px-3 py-1.5 text-sm rounded-md text-gray-600 hover:bg-amber-50"
                        onClick={() => setMobileOpen(false)}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
