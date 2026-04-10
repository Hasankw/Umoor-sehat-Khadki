"use client";

import { useEffect, useState } from "react";

// Muharram 1, 1448H ≈ June 17, 2026 00:00:00 IST (UTC+5:30)
const ASHARA_1448_START = new Date("2026-06-17T00:00:00+05:30");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeLeft {
  const diff = ASHARA_1448_START.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ compact = false }: { compact?: boolean }) {
  const [time, setTime] = useState<TimeLeft>(getTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const isOver = time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0;

  if (!mounted) {
    return <div className={compact ? "h-16" : "h-32"} />;
  }

  if (isOver) {
    return (
      <div className="text-center">
        <p className="text-white font-heading font-bold text-2xl animate-pulse-gold">
          Ashara Mubaraka 1448H is Here — Khadki, Pune
        </p>
      </div>
    );
  }

  const units = [
    { value: time.days,    label: "Days" },
    { value: time.hours,   label: "Hours" },
    { value: time.minutes, label: "Mins" },
    { value: time.seconds, label: "Secs" },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-center gap-2">
            <div className="text-center">
              <div className="font-heading font-bold text-2xl text-white tabular-nums leading-none">
                {String(u.value).padStart(2, "0")}
              </div>
              <div className="text-[10px] text-white/60 uppercase tracking-wider">{u.label}</div>
            </div>
            {i < 3 && <span className="text-white/50 font-bold text-xl mb-3">:</span>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end justify-center gap-3 md:gap-5">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-end gap-3 md:gap-5">
          <div className="countdown-block">
            <span className="countdown-number">{String(u.value).padStart(2, "0")}</span>
            <span className="countdown-label">{u.label}</span>
          </div>
          {i < 3 && (
            <span className="text-white/50 font-bold text-3xl mb-4 leading-none">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
