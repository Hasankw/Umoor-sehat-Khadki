import { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Login — Khadki Jamaat Admin" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: "var(--color-navy)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="bismillah text-2xl mb-2">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
          <h1 className="font-heading font-bold text-2xl text-white">Jamaat Khadki Portal</h1>
          <p className="text-white/50 text-sm mt-1">Login with your ITS ID</p>
        </div>
        <Suspense fallback={<div className="rounded-2xl border p-8 h-64 animate-pulse" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
