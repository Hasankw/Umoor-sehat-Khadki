import { AsharaUpdate } from "@/types";
import { format } from "date-fns";
import { Pin, Bell } from "lucide-react";

interface Props {
  updates: AsharaUpdate[];
}

export default function LiveUpdatesFeed({ updates }: Props) {
  if (!updates.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
        <p>No updates yet. Check back during Ashara for live updates.</p>
      </div>
    );
  }

  const pinned = updates.filter((u) => u.pinned);
  const rest   = updates.filter((u) => !u.pinned);
  const sorted = [...pinned, ...rest];

  return (
    <div className="space-y-4">
      {sorted.map((update) => (
        <div key={update.id}
          className={`rounded-xl p-5 border transition-all ${
            update.pinned
              ? "border-amber-300 bg-amber-50"
              : "border-gray-100 bg-white"
          }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              {update.pinned && (
                <Pin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--color-gold)" }} />
              )}
              <div className="flex-1">
                <h4 className="font-heading font-semibold text-base" style={{ color: "var(--color-navy)" }}>
                  {update.title}
                </h4>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed whitespace-pre-line">
                  {update.body}
                </p>
              </div>
            </div>
            <time className="text-xs text-gray-400 shrink-0">
              {format(new Date(update.posted_at), "dd MMM, h:mm a")}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
}
