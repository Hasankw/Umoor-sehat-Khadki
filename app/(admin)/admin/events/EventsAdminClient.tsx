"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Event, Umoor } from "@/types";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";

const schema = z.object({
  title:       z.string().min(2),
  description: z.string().optional(),
  event_date:  z.string().min(1),
  event_time:  z.string().optional(),
  location:    z.string().optional(),
  umoor_id:    z.string().optional(),
  is_public:   z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function EventsAdminClient({
  events: initial, umoors,
}: {
  events: Event[];
  umoors: Pick<Umoor,"id"|"name">[];
}) {
  const [events, setEvents] = useState(initial);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_public: true, event_date: new Date().toISOString().split("T")[0] },
  });

  async function onCreate(data: FormData) {
    const supabase = createClient();
    const { data: created, error } = await supabase.from("events").insert({
      title:       data.title,
      description: data.description ?? "",
      event_date:  data.event_date,
      event_time:  data.event_time ?? null,
      location:    data.location ?? null,
      umoor_id:    data.umoor_id || null,
      is_public:   data.is_public ?? true,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setEvents([created as Event, ...events]);
    reset();
    toast.success("Event created!");
  }

  async function onDelete(id: string) {
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", id);
    setEvents(events.filter((e) => e.id !== id));
    toast.success("Deleted");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2 className="font-heading font-semibold mb-4" style={{ color: "var(--color-navy)" }}>Add Event</h2>
        <form onSubmit={handleSubmit(onCreate)}
          className="rounded-xl border bg-white p-6 space-y-4"
          style={{ borderColor: "rgba(207,155,0,0.2)" }}>
          <div className="space-y-1"><Label>Title</Label><Input {...register("title")} placeholder="Event title" /></div>
          <div className="space-y-1"><Label>Description</Label><Textarea {...register("description")} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Date</Label><Input type="date" {...register("event_date")} /></div>
            <div className="space-y-1"><Label>Time</Label><Input type="time" {...register("event_time")} /></div>
          </div>
          <div className="space-y-1"><Label>Location</Label><Input {...register("location")} /></div>
          <div className="space-y-1">
            <Label>Umoor</Label>
            <select {...register("umoor_id")} className="w-full border rounded-md px-3 py-2 text-sm">
              <option value="">— No umoor —</option>
              {umoors.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_public" {...register("is_public")} defaultChecked />
            <Label htmlFor="is_public">Public event</Label>
          </div>
          <Button type="submit" disabled={isSubmitting} style={{ background: "var(--color-navy)", color: "white" }} className="w-full">
            {isSubmitting ? "Creating..." : "Create Event"}
          </Button>
        </form>
      </div>

      <div>
        <h2 className="font-heading font-semibold mb-4" style={{ color: "var(--color-navy)" }}>Events ({events.length})</h2>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {events.map((e) => (
            <div key={e.id} className="rounded-xl border bg-white p-4 flex items-start justify-between gap-3"
              style={{ borderColor: "rgba(207,155,0,0.15)" }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>{e.title}</p>
                <p className="text-xs text-gray-400">{format(parseISO(e.event_date), "d MMM yyyy")}{e.location && ` · ${e.location}`}</p>
                {!e.is_public && <span className="text-xs text-gray-300">Private</span>}
              </div>
              <button onClick={() => onDelete(e.id)} className="p-1.5 hover:bg-red-50 rounded">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
