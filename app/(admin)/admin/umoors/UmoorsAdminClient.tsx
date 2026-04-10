"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Umoor } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";
import Link from "next/link";

type EditableFields = Pick<Umoor, "contact_name" | "contact_phone" | "contact_email" | "description">;

export default function UmoorsAdminClient({ umoors: initial }: { umoors: Umoor[] }) {
  const [umoors,  setUmoors]  = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft,   setDraft]   = useState<EditableFields>({
    contact_name: "", contact_phone: "", contact_email: "", description: "",
  });
  const [saving, setSaving] = useState(false);

  function startEdit(u: Umoor) {
    setEditing(u.id);
    setDraft({
      contact_name:  u.contact_name,
      contact_phone: u.contact_phone,
      contact_email: u.contact_email,
      description:   u.description,
    });
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("umoors").update(draft).eq("id", id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setUmoors(umoors.map((u) => u.id === id ? { ...u, ...draft } : u));
    setEditing(null);
    toast.success("Umoor updated");
  }

  return (
    <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "rgba(207,155,0,0.2)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--color-navy)", color: "white" }}>
              {["#","Name","Contact Name","Phone","Email","Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {umoors.map((u) => {
              const isEdit = editing === u.id;
              return (
                <tr key={u.id} className={`border-t border-gray-50 ${isEdit ? "bg-amber-50/30" : "hover:bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-400 text-xs">{u.display_order}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold" style={{ color: "var(--color-navy)" }}>{u.name}</p>
                    <p className="arabic-text text-xs text-gray-400">{u.name_ar}</p>
                  </td>
                  <td className="px-4 py-3">
                    {isEdit
                      ? <Input value={draft.contact_name} onChange={(e) => setDraft({ ...draft, contact_name: e.target.value })}
                          className="h-7 text-xs w-32" />
                      : <span className="text-gray-600">{u.contact_name || "—"}</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {isEdit
                      ? <Input value={draft.contact_phone} onChange={(e) => setDraft({ ...draft, contact_phone: e.target.value })}
                          className="h-7 text-xs w-36" />
                      : <span className="text-gray-500 text-xs">{u.contact_phone || "—"}</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {isEdit
                      ? <Input value={draft.contact_email} onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })}
                          className="h-7 text-xs w-44" />
                      : <span className="text-gray-500 text-xs">{u.contact_email || "—"}</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {isEdit ? (
                      <div className="flex gap-1">
                        <Button size="sm" disabled={saving}
                          onClick={() => saveEdit(u.id)}
                          style={{ background: "var(--color-navy)", color: "white" }}
                          className="h-7 px-2">
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)}
                          className="h-7 px-2">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <button onClick={() => startEdit(u)}
                          className="p-1.5 rounded hover:bg-gray-100">
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <Link href={`/umoors/${u.id}`}
                          className="text-xs hover:underline"
                          style={{ color: "var(--color-gold-dark)" }}>
                          View →
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
