"use client";

import { useState } from "react";
import { Message, Umoor, MessageStatus } from "@/types";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare } from "lucide-react";

type EnrichedMessage = Message & { umoor: Pick<Umoor, "name"> | null };

const STATUS_COLORS: Record<MessageStatus, string> = {
  new:     "bg-blue-100 text-blue-800",
  read:    "bg-gray-100 text-gray-600",
  replied: "bg-green-100 text-green-800",
};

export default function MessagesAdminClient({ messages: initial }: { messages: EnrichedMessage[] }) {
  const [messages, setMessages] = useState(initial);
  const [selected, setSelected] = useState<EnrichedMessage | null>(null);
  const [reply,    setReply]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function markRead(msg: EnrichedMessage) {
    if (msg.status !== "new") return;
    const supabase = createClient();
    await supabase.from("messages").update({ status: "read" }).eq("id", msg.id);
    setMessages(messages.map((m) => m.id === msg.id ? { ...m, status: "read" as MessageStatus } : m));
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("messages").update({
      reply,
      status:     "replied",
      replied_at: new Date().toISOString(),
    }).eq("id", selected.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    const updated = { ...selected, reply, status: "replied" as MessageStatus, replied_at: new Date().toISOString() };
    setMessages(messages.map((m) => m.id === selected.id ? updated : m));
    setSelected(updated);
    setReply("");
    toast.success("Reply saved");
  }

  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
      {/* List */}
      <div className="lg:col-span-1 space-y-2">
        <p className="text-xs text-gray-400 mb-3">
          {messages.length} messages · {newCount} new
        </p>
        {messages.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No messages.</p>
        ) : messages.map((m) => (
          <button key={m.id}
            onClick={() => { setSelected(m); markRead(m); setReply(m.reply ?? ""); }}
            className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-sm ${
              selected?.id === m.id ? "ring-1" : ""
            } ${m.status === "new" ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100"}`}
            style={selected?.id === m.id ? { outline: `2px solid var(--color-gold)` } : {}}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: "var(--color-navy)" }}>{m.sender_name}</p>
                <p className="text-xs text-gray-400 truncate">{m.subject}</p>
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${STATUS_COLORS[m.status]}`}>
                {m.status}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              {m.umoor && (
                <span className="text-xs" style={{ color: "var(--color-gold-dark)" }}>{m.umoor.name}</span>
              )}
              <span className="text-xs text-gray-300">{format(parseISO(m.created_at), "d MMM")}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Detail */}
      <div className="lg:col-span-2">
        {!selected ? (
          <div className="rounded-xl border bg-white flex items-center justify-center h-full p-8 text-center"
            style={{ borderColor: "rgba(207,155,0,0.15)" }}>
            <div>
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">Select a message to read and reply</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-white p-6 space-y-5"
            style={{ borderColor: "rgba(207,155,0,0.2)" }}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap pb-4 border-b"
              style={{ borderColor: "rgba(207,155,0,0.1)" }}>
              <div>
                <h3 className="font-heading font-bold text-lg" style={{ color: "var(--color-navy)" }}>
                  {selected.subject}
                </h3>
                <p className="text-sm text-gray-500">
                  From: <strong>{selected.sender_name}</strong> · ITS: {selected.sender_its_id}
                </p>
                <a href={`tel:${selected.sender_phone}`}
                  className="flex items-center gap-1 text-xs mt-0.5 hover:underline"
                  style={{ color: "var(--color-gold-dark)" }}>
                  <Phone className="w-3 h-3" />{selected.sender_phone}
                </a>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>{format(parseISO(selected.created_at), "d MMM yyyy, h:mm a")}</p>
                {selected.umoor && <p style={{ color: "var(--color-gold-dark)" }}>{selected.umoor.name}</p>}
              </div>
            </div>

            {/* Message body */}
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-line">
              {selected.message}
            </div>

            {/* Reply */}
            {selected.status === "replied" && selected.reply ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-xs font-medium text-green-700 mb-1">Your Reply:</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{selected.reply}</p>
                {selected.replied_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    Sent: {format(parseISO(selected.replied_at!), "d MMM, h:mm a")}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "var(--color-navy)" }}>
                  Reply to sender:
                </label>
                <Textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply..." />
                <Button onClick={sendReply} disabled={loading || !reply.trim()}
                  style={{ background: "var(--color-navy)", color: "white" }}>
                  {loading ? "Saving..." : "Send Reply"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
