"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { FmbMenu } from "@/types";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

const schema = z.object({
  date:      z.string().min(1),
  meal_type: z.enum(["breakfast","nashta","lunch","dinner"]),
  items:     z.string().min(1, "Add at least one item"),
  notes:     z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast", nashta: "Nashta", lunch: "Lunch", dinner: "Dinner",
};

export default function FmbAdminClient({ menus: initial }: { menus: FmbMenu[] }) {
  const [menus, setMenus] = useState(initial);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      meal_type: "lunch",
    },
  });

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    const items = data.items.split("\n").map((i) => i.trim()).filter(Boolean);
    const { data: created, error } = await supabase
      .from("fmb_menu")
      .upsert({
        date:      data.date,
        meal_type: data.meal_type,
        items,
        notes:     data.notes ?? null,
      }, { onConflict: "date,meal_type" })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    const m = created as FmbMenu;
    setMenus((prev) => {
      const idx = prev.findIndex((x) => x.date === m.date && x.meal_type === m.meal_type);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = m; return copy; }
      return [...prev, m].sort((a, b) => a.date.localeCompare(b.date));
    });
    reset({ date: data.date, meal_type: data.meal_type });
    toast.success("Menu saved!");
  }

  async function deleteMenu(id: string) {
    const supabase = createClient();
    await supabase.from("fmb_menu").delete().eq("id", id);
    setMenus(menus.filter((m) => m.id !== id));
    toast.success("Deleted");
  }

  // Group by date
  const byDate = menus.reduce((acc, m) => {
    if (!acc[m.date]) acc[m.date] = [];
    acc[m.date].push(m);
    return acc;
  }, {} as Record<string, FmbMenu[]>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <div>
        <h2 className="font-heading font-semibold mb-4" style={{ color: "var(--color-navy)" }}>
          Add / Update Menu
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}
          className="rounded-xl border bg-white p-6 space-y-4"
          style={{ borderColor: "rgba(207,155,0,0.2)" }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" {...register("date")} />
            </div>
            <div className="space-y-1">
              <Label>Meal Type</Label>
              <select {...register("meal_type")}
                className="w-full border rounded-md px-3 py-2 text-sm"
                style={{ borderColor: "hsl(var(--border))" }}>
                {Object.entries(MEAL_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Menu Items (one per line)</Label>
            <textarea {...register("items")} rows={6}
              placeholder="Dal Chawal&#10;Sabzi&#10;Roti&#10;Fruit"
              className="w-full border rounded-md px-3 py-2 text-sm resize-y"
              style={{ borderColor: "hsl(var(--border))" }} />
            {errors.items && <p className="text-xs text-red-500">{errors.items.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Input placeholder="e.g. Special biryani today" {...register("notes")} />
          </div>
          <Button type="submit" disabled={isSubmitting}
            className="w-full" style={{ background: "var(--color-navy)", color: "white" }}>
            {isSubmitting ? "Saving..." : "Save Menu"}
          </Button>
          <p className="text-xs text-gray-400 text-center">
            Saving will overwrite existing menu for the same date + meal type.
          </p>
        </form>
      </div>

      {/* List */}
      <div>
        <h2 className="font-heading font-semibold mb-4" style={{ color: "var(--color-navy)" }}>
          This Month ({menus.length} entries)
        </h2>
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {Object.keys(byDate).sort().reverse().map((date) => (
            <div key={date} className="rounded-xl border bg-white overflow-hidden"
              style={{ borderColor: "rgba(207,155,0,0.15)" }}>
              <div className="px-4 py-2.5 border-b text-sm font-semibold"
                style={{ borderColor: "rgba(207,155,0,0.1)", background: "rgba(207,155,0,0.04)", color: "var(--color-navy)" }}>
                {format(parseISO(date), "EEEE, d MMMM yyyy")}
              </div>
              <div className="divide-y divide-gray-50">
                {byDate[date].map((m) => (
                  <div key={m.id} className="flex items-start justify-between px-4 py-3 gap-3">
                    <div className="flex-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded"
                        style={{ background: "rgba(207,155,0,0.1)", color: "var(--color-gold-dark)" }}>
                        {MEAL_LABELS[m.meal_type]}
                      </span>
                      <p className="text-xs text-gray-500 mt-1.5">
                        {(m.items as string[]).join(" · ")}
                      </p>
                    </div>
                    <button onClick={() => deleteMenu(m.id)}
                      className="p-1.5 rounded hover:bg-red-50 shrink-0">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {menus.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">No menus posted this month.</p>
          )}
        </div>
      </div>
    </div>
  );
}
