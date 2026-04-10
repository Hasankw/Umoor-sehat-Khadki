import { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Umoor Sehat — Login" };

export default function SehatLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "var(--color-navy)" }}>

      {/* Logos */}
      <div className="flex items-center justify-center mb-6">
        <Image src="/images/logo-final.jpg" alt="Saifee Ambulance Corps · Anjuman-e-Badri · Umoor Sehat" width={360} height={112} className="object-contain" />
      </div>

      <p className="text-white/60 text-xs tracking-widest uppercase mb-1">Dawat-e-Hadiyah | Jamaat Kirkee, Poona</p>
      <h1 className="font-heading font-bold text-xl text-white mb-1">Umoor Sehat</h1>
      <p className="text-white/50 text-sm mb-8">Ashara Ohabat 1448H — Medical Camp</p>

      <div className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <Suspense fallback={<div className="h-32 animate-pulse rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }} />}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-8 text-xs text-white/30">
        © 2026 · Developed by{" "}
        <a href="https://hasankanchwala.dev" target="_blank" rel="noopener noreferrer"
          className="hover:underline text-white/50">
          Hasan Kanchwala
        </a>
      </p>
    </div>
  );
}
