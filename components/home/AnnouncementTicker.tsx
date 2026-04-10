"use client";

import { Announcement } from "@/types";
import { Megaphone } from "lucide-react";

interface Props {
  announcements: Announcement[];
}

export default function AnnouncementTicker({ announcements }: Props) {
  if (!announcements.length) return null;

  const text = announcements
    .sort((a, b) => b.priority - a.priority)
    .map((a) => a.title)
    .join("   •   ");

  return (
    <div className="text-white text-sm py-1.5 flex items-center gap-3 overflow-hidden"
      style={{ background: "var(--color-gold-dark)" }}>
      <div className="flex items-center gap-2 px-3 shrink-0 border-r border-white/30">
        <Megaphone className="w-3.5 h-3.5" />
        <span className="font-semibold text-xs uppercase tracking-wide">News</span>
      </div>
      <div className="ticker-wrap flex-1">
        <span className="ticker-text">{text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
      </div>
    </div>
  );
}
