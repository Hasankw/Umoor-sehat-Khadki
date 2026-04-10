import { AsharaScheduleDay } from "@/types";
import { format } from "date-fns";

interface Props {
  schedule: AsharaScheduleDay[];
}

const DAY_NAMES = [
  "", "Ashura Eve (Laylat al-Ashura) — Day 1",
  "Day 2", "Day 3", "Day 4", "Day 5",
  "Day 6", "Day 7", "Day 8", "Day 9",
  "Ashura — Day 10 (Yawm al-Ashura)",
];

export default function ProgramSchedule({ schedule }: Props) {
  if (!schedule.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        Schedule will be posted closer to Ashara. Check back soon.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "rgba(207,155,0,0.2)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "var(--color-navy)" }} className="text-white">
            <th className="px-4 py-3 text-left font-heading font-semibold">Day</th>
            <th className="px-4 py-3 text-left font-heading font-semibold">Date</th>
            <th className="px-4 py-3 text-left font-heading font-semibold">Fajr</th>
            <th className="px-4 py-3 text-left font-heading font-semibold">Zohr–Asr</th>
            <th className="px-4 py-3 text-left font-heading font-semibold">Maghrib–Isha</th>
            <th className="px-4 py-3 text-left font-heading font-semibold">Waaz</th>
            <th className="px-4 py-3 text-left font-heading font-semibold">Notes</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((day, i) => (
            <tr key={day.id}
              className={`border-t transition-colors ${
                day.day_number === 10
                  ? "bg-red-50"
                  : i % 2 === 0 ? "bg-white" : "bg-amber-50/30"
              }`}
              style={{ borderColor: "rgba(207,155,0,0.1)" }}>
              <td className="px-4 py-3">
                <div className="font-heading font-bold" style={{ color: "var(--color-navy)" }}>
                  {day.day_number === 10 ? "10 — Ashura" : `Day ${day.day_number}`}
                </div>
                <div className="text-xs text-gray-400">{DAY_NAMES[day.day_number]?.split(" — ")[0]}</div>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {format(new Date(day.date), "EEE, dd MMM yyyy")}
              </td>
              <td className="px-4 py-3 font-mono text-gray-700">
                {day.namaaz_times?.fajr || "—"}
              </td>
              <td className="px-4 py-3 font-mono text-gray-700">
                {day.namaaz_times?.zohr_asr || "—"}
              </td>
              <td className="px-4 py-3 font-mono text-gray-700">
                {day.namaaz_times?.maghrib_isha || "—"}
              </td>
              <td className="px-4 py-3 font-mono" style={{ color: "var(--color-gold-dark)" }}>
                {day.waaz_time || "TBA"}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {day.special_notes || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
