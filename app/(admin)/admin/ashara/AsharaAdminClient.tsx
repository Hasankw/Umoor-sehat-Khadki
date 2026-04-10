"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { AsharaConfig, AsharaScheduleDay, AsharaUpdate } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { Pin, PinOff, Trash2 } from "lucide-react";

const updateSchema = z.object({
  title:  z.string().min(2),
  body:   z.string().min(5),
  pinned: z.boolean().optional(),
});
type UpdateForm = z.infer<typeof updateSchema>;

interface Props {
  config:   AsharaConfig | null;
  schedule: AsharaScheduleDay[];
  updates:  AsharaUpdate[];
}

export default function AsharaAdminClient({ config, schedule, updates: initialUpdates }: Props) {
  const [updates,  setUpdates]  = useState<AsharaUpdate[]>(initialUpdates);
  const [status,   setStatus]   = useState<"upcoming" | "live" | "completed">(config?.status ?? "upcoming");
  const [loading,  setLoading]  = useState(false);
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: { pinned: false },
  });

  async function updateStatus(newStatus: "upcoming" | "live" | "completed") {
    if (!config) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("ashara_config")
      .update({ status: newStatus })
      .eq("id", config.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setStatus(newStatus);
    toast.success(`Status updated to: ${newStatus}`);
    router.refresh();
  }

  async function postUpdate(data: UpdateForm) {
    if (!config) return;
    const supabase = createClient();
    const { data: newUpdate, error } = await supabase
      .from("ashara_updates")
      .insert({
        ashara_config_id: config.id,
        title: data.title,
        body:  data.body,
        pinned: data.pinned ?? false,
      })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    setUpdates([newUpdate as AsharaUpdate, ...updates]);
    reset();
    toast.success("Update posted!");
  }

  async function deleteUpdate(id: string) {
    const supabase = createClient();
    await supabase.from("ashara_updates").delete().eq("id", id);
    setUpdates(updates.filter((u) => u.id !== id));
    toast.success("Update deleted");
  }

  async function togglePin(update: AsharaUpdate) {
    const supabase = createClient();
    await supabase.from("ashara_updates").update({ pinned: !update.pinned }).eq("id", update.id);
    setUpdates(updates.map((u) => u.id === update.id ? { ...u, pinned: !u.pinned } : u));
  }

  async function updateScheduleTime(dayId: string, field: string, value: string) {
    const supabase = createClient();
    const update: Record<string, unknown> = {};
    if (field === "waaz_time") {
      update.waaz_time = value;
    } else {
      const day = schedule.find((s) => s.id === dayId);
      if (!day) return;
      update.namaaz_times = { ...day.namaaz_times, [field]: value };
    }
    const { error } = await supabase.from("ashara_schedule").update(update).eq("id", dayId);
    if (error) { toast.error(error.message); return; }
    toast.success("Schedule updated");
    router.refresh();
  }

  return (
    <Tabs defaultValue="status">
      <TabsList className="mb-6">
        <TabsTrigger value="status">Status</TabsTrigger>
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
        <TabsTrigger value="updates">Updates ({updates.length})</TabsTrigger>
      </TabsList>

      {/* Status Tab */}
      <TabsContent value="status">
        <div className="rounded-xl border bg-white p-6" style={{ borderColor: "rgba(207,155,0,0.2)" }}>
          <h2 className="font-heading font-semibold text-lg mb-4" style={{ color: "var(--color-navy)" }}>
            Ashara 1448H Status
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Current status:</p>
              <span className={`status-${status}`}>{status}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {(["upcoming", "live", "completed"] as const).map((s) => (
                <Button key={s} variant={status === s ? "default" : "outline"}
                  disabled={loading || status === s}
                  onClick={() => updateStatus(s)}
                  style={status === s ? { background: "var(--color-navy)", color: "white" } : {}}>
                  Set: {s}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Set to <strong>live</strong> on June 17, 2026 (Muharram 1, 1448H).
              Set to <strong>completed</strong> on June 26, 2026.
            </p>
          </div>

          {config && (
            <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Venue</p>
                <p className="font-medium">{config.venue_name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Dates</p>
                <p className="font-medium">
                  {format(parseISO(config.start_date), "d MMM")} – {format(parseISO(config.end_date), "d MMM yyyy")}
                </p>
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      {/* Schedule Tab */}
      <TabsContent value="schedule">
        <div className="rounded-xl border bg-white overflow-hidden"
          style={{ borderColor: "rgba(207,155,0,0.2)" }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(207,155,0,0.1)" }}>
            <h2 className="font-heading font-semibold" style={{ color: "var(--color-navy)" }}>
              10-Day Schedule
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Edit times inline. Changes save immediately.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Day</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Waaz</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Fajr</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Zohr-Asr</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Maghrib-Isha</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((day) => (
                  <tr key={day.id} className="border-t border-gray-50">
                    <td className="px-4 py-3 font-bold" style={{ color: "var(--color-navy)" }}>
                      Day {day.day_number}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {format(parseISO(day.date), "EEE d MMM")}
                    </td>
                    {(["waaz_time", "fajr", "zohr_asr", "maghrib_isha"] as const).map((field) => {
                      const val = field === "waaz_time" ? day.waaz_time : day.namaaz_times?.[field as keyof typeof day.namaaz_times];
                      return (
                        <td key={field} className="px-4 py-2">
                          <input
                            type="time"
                            defaultValue={val ?? ""}
                            className="border rounded px-2 py-1 text-xs w-28"
                            style={{ borderColor: "rgba(207,155,0,0.3)" }}
                            onBlur={(e) => updateScheduleTime(day.id, field, e.target.value)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>

      {/* Updates Tab */}
      <TabsContent value="updates">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Post new update */}
          <div>
            <h3 className="font-heading font-semibold mb-3" style={{ color: "var(--color-navy)" }}>
              Post New Update
            </h3>
            <form onSubmit={handleSubmit(postUpdate)}
              className="rounded-xl border bg-white p-5 space-y-4"
              style={{ borderColor: "rgba(207,155,0,0.2)" }}>
              <div className="space-y-1">
                <Label>Title</Label>
                <Input placeholder="Update title..." {...register("title")} />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Body</Label>
                <Textarea rows={4} placeholder="Update content..." {...register("body")} />
                {errors.body && <p className="text-xs text-red-500">{errors.body.message}</p>}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pinned" {...register("pinned")} />
                <Label htmlFor="pinned" className="cursor-pointer">Pin this update</Label>
              </div>
              <Button type="submit" disabled={isSubmitting}
                style={{ background: "var(--color-navy)", color: "white" }}>
                {isSubmitting ? "Posting..." : "Post Update"}
              </Button>
            </form>
          </div>

          {/* Existing updates */}
          <div>
            <h3 className="font-heading font-semibold mb-3" style={{ color: "var(--color-navy)" }}>
              Posted Updates ({updates.length})
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {updates.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No updates posted yet.</p>
              ) : updates.map((u) => (
                <div key={u.id} className={`rounded-xl border p-4 ${u.pinned ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{u.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(parseISO(u.posted_at), "d MMM, h:mm a")}
                        {u.pinned && " · PINNED"}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{u.body}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => togglePin(u)}
                        className="p-1.5 rounded hover:bg-gray-100" title={u.pinned ? "Unpin" : "Pin"}>
                        {u.pinned ? <PinOff className="w-3.5 h-3.5 text-gray-500" /> : <Pin className="w-3.5 h-3.5 text-gray-400" />}
                      </button>
                      <button onClick={() => deleteUpdate(u.id)}
                        className="p-1.5 rounded hover:bg-red-50" title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
