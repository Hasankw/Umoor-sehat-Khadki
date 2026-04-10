import { redirect } from "next/navigation";
import { isSehatAuthed } from "@/lib/sehat-auth";
import Image from "next/image";
import LogoutButton from "./LogoutButton";

export default async function SehatAdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isSehatAuthed();
  if (!authed) redirect("/sehat/login");

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fa" }}>
      {/* Top nav — hidden on print */}
      <header className="no-print sticky top-0 z-50 shadow-sm"
        style={{ background: "var(--color-navy)", borderBottom: "2px solid var(--color-gold)" }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/images/logo-sehat.png" alt="Sehat" width={36} height={36} className="object-contain" />
            <div>
              <p className="text-white font-heading font-bold text-sm leading-tight">Umoor Sehat</p>
              <p className="text-white/50 text-xs">Khadki Jamaat — Admin</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>

      <footer className="no-print mt-8 py-4 text-center text-xs text-gray-400 border-t border-gray-200">
        © 2026 · Developed by{" "}
        <a href="https://hasankanchwala.dev" target="_blank" rel="noopener noreferrer"
          className="hover:underline" style={{ color: "var(--color-gold-dark)" }}>
          Hasan Kanchwala
        </a>
      </footer>
    </div>
  );
}
