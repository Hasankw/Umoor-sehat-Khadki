import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { FmbMenu } from "@/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { UtensilsCrossed, Printer } from "lucide-react";

export const metadata: Metadata = {
  title: "FMB Menu — Faza ul Mawaid Buhaniyah",
  description: "Day-wise meal menu for Khadki Jamaat FMB.",
};

export const revalidate = 300;

const MEAL_ORDER: FmbMenu["meal_type"][] = ["breakfast", "nashta", "lunch", "dinner"];
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  nashta:    "Nashta",
  lunch:     "Lunch",
  dinner:    "Dinner",
};
const MEAL_COLORS: Record<string, string> = {
  breakfast: "bg-orange-50 border-orange-200",
  nashta:    "bg-yellow-50 border-yellow-200",
  lunch:     "bg-green-50 border-green-200",
  dinner:    "bg-blue-50 border-blue-200",
};

export default async function FmbPage() {
  const supabase = await createClient();
  const today    = new Date();
  const start    = format(startOfMonth(today), "yyyy-MM-dd");
  const end      = format(endOfMonth(today),   "yyyy-MM-dd");

  const { data } = await supabase
    .from("fmb_menu")
    .select("*")
    .gte("date", start)
    .lte("date", end)
    .order("date")
    .order("meal_type");

  const menus = (data || []) as FmbMenu[];
  const days  = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });
  const todayStr = format(today, "yyyy-MM-dd");

  const byDate = menus.reduce((acc, m) => {
    if (!acc[m.date]) acc[m.date] = [];
    acc[m.date].push(m);
    return acc;
  }, {} as Record<string, FmbMenu[]>);

  const daysWithMenu = days.filter((d) => byDate[format(d, "yyyy-MM-dd")]);

  return (
    <div className="min-h-screen bg-cream">
      <div className="py-12 px-4" style={{ background: "var(--color-navy)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="h-1 w-12 rounded mb-4" style={{ background: "var(--color-gold)" }} />
            <h1 className="font-heading font-bold text-3xl text-white mb-1">
              Faza ul Mawaid Buhaniyah
            </h1>
            <p className="text-white/60">Daily meal menu — {format(today, "MMMM yyyy")}</p>
          </div>
          <button className="no-print flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white border border-white/20 hover:bg-white/10 transition-colors"
            onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print Menu
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Today's menu highlight */}
        {byDate[todayStr] && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="status-live text-xs">Today</span>
              <h2 className="section-heading text-xl">
                {format(today, "EEEE, d MMMM yyyy")}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MEAL_ORDER.map((mealType) => {
                const menu = byDate[todayStr].find((m) => m.meal_type === mealType);
                return (
                  <div key={mealType} className={`rounded-xl border p-4 ${MEAL_COLORS[mealType]}`}>
                    <p className="font-heading font-semibold text-sm mb-2" style={{ color: "var(--color-navy)" }}>
                      {MEAL_LABELS[mealType]}
                    </p>
                    {menu ? (
                      <ul className="space-y-1">
                        {(menu.items as string[]).map((item, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="mt-0.5 shrink-0">•</span>{item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-400">Not available</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full month */}
        <h2 className="section-heading text-xl mb-4">
          {format(today, "MMMM yyyy")} Menu
        </h2>

        {daysWithMenu.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No menu posted for {format(today, "MMMM yyyy")} yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {daysWithMenu.map((day) => {
              const ds   = format(day, "yyyy-MM-dd");
              const dayMenus = byDate[ds];
              const isToday  = ds === todayStr;
              return (
                <div key={ds} className={`rounded-xl border bg-white overflow-hidden ${isToday ? "ring-2" : ""}`}
                  style={isToday ? { borderColor: "var(--color-gold)", outline: "2px solid var(--color-gold)" } : { borderColor: "rgba(207,155,0,0.15)" }}>
                  <div className="px-5 py-3 border-b flex items-center gap-3"
                    style={{ borderColor: "rgba(207,155,0,0.1)", background: isToday ? "rgba(207,155,0,0.06)" : undefined }}>
                    {isToday && <span className="status-live text-xs">Today</span>}
                    <h3 className="font-heading font-semibold text-sm" style={{ color: "var(--color-navy)" }}>
                      {format(day, "EEEE, d MMMM yyyy")}
                    </h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {MEAL_ORDER.map((mealType) => {
                      const menu = dayMenus.find((m) => m.meal_type === mealType);
                      if (!menu) return null;
                      return (
                        <div key={mealType} className={`rounded-lg border p-3 ${MEAL_COLORS[mealType]}`}>
                          <p className="font-semibold text-xs mb-1.5" style={{ color: "var(--color-navy)" }}>
                            {MEAL_LABELS[mealType]}
                          </p>
                          <ul className="space-y-0.5">
                            {(menu.items as string[]).map((item, i) => (
                              <li key={i} className="text-xs text-gray-600">• {item}</li>
                            ))}
                          </ul>
                          {menu.notes && <p className="text-xs text-gray-400 mt-1 italic">{menu.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
