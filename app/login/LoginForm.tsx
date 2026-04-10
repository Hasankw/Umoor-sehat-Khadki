"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LoginForm() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const router      = useRouter();
  const searchParams = useSearchParams();
  const redirect    = searchParams.get("redirect") ?? "/";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Login successful");
    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleLogin}
      className="rounded-2xl border p-8 space-y-5"
      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
      <div className="space-y-1">
        <Label htmlFor="email" className="text-white/80">Email</Label>
        <Input id="email" type="email" placeholder="your@email.com" value={email}
          onChange={(e) => setEmail(e.target.value)} required
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password" className="text-white/80">Password</Label>
        <Input id="password" type="password" placeholder="••••••••" value={password}
          onChange={(e) => setPassword(e.target.value)} required
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40" />
      </div>
      <Button type="submit" disabled={loading} className="w-full font-semibold"
        style={{ background: "var(--color-gold)", color: "white" }}>
        {loading ? "Logging in..." : "Login"}
      </Button>
      <p className="text-center text-white/40 text-xs">
        Contact admin if you do not have login credentials.
      </p>
    </form>
  );
}
