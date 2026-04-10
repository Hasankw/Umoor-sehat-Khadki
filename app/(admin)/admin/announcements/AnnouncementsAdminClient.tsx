"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Announcement } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, EyeOff } from "lucide-react";
import { parseISO, format } from "date-fns";

const schema = z.object({
  title:      z.string().min(2, "Title required"),
  content:    z.string().min(5, "Content required"),
  priority:   z.coerce.number().min(1).max(10),
  expires_at: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function AnnouncementsAdminClient({ announcements: initial }: { announcements: Announcement[] }) {
  const [items, setItems] = useState(initial);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 1 },
  });

  async function onAdd(data: FormData) {
    const supabase = createClient();
    const { data: inserted, error } = await supabase
      .from("announcements")
      .insert({
        title:      data.title,
        content:    data.content,
        priority:   data.priority,
        active:     true,
        expires_at: data.expires_at || null,
      })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    setItems([inserted as Announcement, ...items]);
    reset();
    toast.success("Announcement added");
  }

  async function toggleActive(item: Announcement) {
    const supabase = createClient();
    await supabase.from("announcements").update({ active: !item.active }).eq("id", item.id);
    setItems(items.map((a) => a.id === item.id ? { ...a, active: !a.active } : a));
    toast.success(item.active ? "Hidden" : "Shown");
  }

  async function deleteItem(id: string) {
    const supabase = createClient();
    await supabase.from("announcements").delete().eq("id", id);
    setItems(items.filter((a) => a.id !== id));
    toast.success("Deleted");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Add form */}
      <div>
        <h3 className="font-heading font-semibold mb-3" style={{ color: "var(--color-navy)" }}>
          New Announcement
        </h3>
        <form onSubmit={handleSubmit(onAdd)}
          className="rounded-xl border bg-white p-5 space-y-4"
          style={{ borderColor: "rgba(207,155,0,0.2)" }}>
          <div className="space-y-1">
            <Label>Title</Label>
            <Input placeholder="Short headline..." {...register("title")} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Content (shown in ticker)</Label>
            <Textarea rows={3} placeholder="Full announcement text..." {...register("content")} />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Priority (1–10)</Label>
              <Input type="number" min={1} max={10} {...register("priority")} />
            </div>
            <div className="space-y-1">
              <Label>Expires (optional)</Label>
              <Input type="date" {...register("expires_at")} />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}
            style={{ background: "var(--color-navy)", color: "white" }}>
            {isSubmitting ? "Adding..." : "Add Announcement"}
          </Button>
        </form>
      </div>

      {/* List */}
      <div>
        <h3 className="font-heading font-semibold mb-3" style={{ color: "var(--color-navy)" }}>
          All Announcements ({items.length})
        </h3>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No announcements yet.</p>
          ) : items.map((a) => (
            <div key={a.id}
              className={`rounded-xl border p-4 ${a.active ? "bg-white" : "bg-gray-50 opacity-60"}`}
              style={{ borderColor: a.active ? "rgba(207,155,0,0.2)" : "rgba(0,0,0,0.1)" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>
                      {a.title}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                    }`}>
                      {a.active ? "Active" : "Hidden"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                      P{a.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                  {a.expires_at && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Expires: {format(parseISO(a.expires_at), "d MMM yyyy")}
                    </p>
                  )}
                  <p className="text-xs text-gray-300 mt-0.5">
                    Added: {format(parseISO(a.created_at), "d MMM yyyy")}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggleActive(a)}
                    className="p-1.5 rounded hover:bg-gray-100" title={a.active ? "Hide" : "Show"}>
                    {a.active
                      ? <EyeOff className="w-4 h-4 text-gray-400" />
                      : <Eye className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button onClick={() => deleteItem(a.id)}
                    className="p-1.5 rounded hover:bg-red-50" title="Delete">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
