import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Umoor } from "@/types";
import MessageForm from "./MessageForm";

export const metadata: Metadata = {
  title: "Send Message — Khadki Jamaat",
  description: "Contact any umoor coordinator of Khadki Jamaat.",
};

export const revalidate = 3600;

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("umoors").select("id, name, name_ar").order("display_order");
  const umoors = (data || []) as Pick<Umoor, "id" | "name" | "name_ar">[];

  return (
    <div className="min-h-screen bg-cream">
      <div className="py-12 px-4" style={{ background: "var(--color-navy)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="h-1 w-12 rounded mb-4" style={{ background: "var(--color-gold)" }} />
          <h1 className="font-heading font-bold text-3xl text-white mb-2">Send Message</h1>
          <p className="text-white/60">Reach any umoor coordinator directly</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <MessageForm umoors={umoors} />
      </div>
    </div>
  );
}
