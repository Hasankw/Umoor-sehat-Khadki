"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, isPast, startOfWeek, endOfWeek,
} from "date-fns";

interface BookedDate {
  date: string;
  status: "confirmed" | "pending";
}

interface Props {
  bookedDates: BookedDate[];
  onSelectDate: (date: Date) => void;
  selectedDate?: Date | null;
  blockedDates?: string[];
}

export default function AvailabilityCalendar({
  bookedDates,
  onSelectDate,
  selectedDate,
  blockedDates = [],
}: Props) {
  const [viewMonth, setViewMonth] = useState(new Date());

  const monthStart  = startOfMonth(viewMonth);
  const monthEnd    = endOfMonth(viewMonth);
  const calStart    = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd      = endOfWeek(monthEnd,     { weekStartsOn: 1 });
  const days        = eachDayOfInterval({ start: calStart, end: calEnd });

  function getStatus(day: Date): "booked" | "blocked" | "available" | "past" | "today" {
    if (isPast(day) && !isToday(day)) return "past";
    if (isToday(day)) return "today";
    const ds = format(day, "yyyy-MM-dd");
    if (blockedDates.includes(ds)) return "blocked";
    if (bookedDates.some((b) => b.date === ds && b.status === "confirmed")) return "booked";
    return "available";
  }

  const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="bg-white rounded-xl border p-4" style={{ borderColor: "rgba(207,155,0,0.2)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-heading font-semibold" style={{ color: "var(--color-navy)" }}>
          {format(viewMonth, "MMMM yyyy")}
        </h3>
        <button onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const status  = getStatus(day);
          const outside = !isSameMonth(day, viewMonth);
          const sel     = selectedDate && isSameDay(day, selectedDate);

          const base = "w-full aspect-square flex items-center justify-center text-sm rounded-lg transition-all font-medium";
          const styles: Record<string, string> = {
            past:      "text-gray-300 cursor-not-allowed",
            booked:    "bg-red-100 text-red-600 cursor-not-allowed",
            blocked:   "bg-gray-100 text-gray-400 cursor-not-allowed",
            available: "hover:bg-amber-50 cursor-pointer text-gray-700 hover:text-amber-800",
            today:     "ring-2 cursor-pointer text-gray-700",
          };

          return (
            <button
              key={day.toISOString()}
              onClick={() => status === "available" || status === "today" ? onSelectDate(day) : undefined}
              disabled={["past", "booked", "blocked"].includes(status)}
              className={`${base} ${outside ? "opacity-20" : ""} ${styles[status]} ${
                sel ? "text-white font-bold shadow-md" : ""
              }`}
              style={
                sel
                  ? { background: "var(--color-navy)" }
                  : status === "today"
                  ? { outline: "2px solid var(--color-gold)" }
                  : {}
              }
              title={status === "booked" ? "Already booked" : status === "blocked" ? "Blocked" : format(day, "d MMM")}>
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t text-xs text-gray-500">
        {[
          { color: "bg-green-100 border-green-300",  label: "Available" },
          { color: "bg-red-100 border-red-300",      label: "Booked" },
          { color: "bg-gray-100 border-gray-300",    label: "Blocked" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border ${l.color}`} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
