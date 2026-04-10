"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { Umoor } from "@/types";

const schema = z.object({
  sender_name:   z.string().min(2, "Name required"),
  sender_its_id: z.string().min(6, "ITS ID required"),
  sender_phone:  z.string().min(10, "Phone required"),
  to_umoor_id:   z.string().uuid("Select an umoor"),
  subject:       z.string().min(3, "Subject required"),
  message:       z.string().min(10, "Message too short (min 10 chars)"),
});
type FormData = z.infer<typeof schema>;

interface Props {
  umoors: Pick<Umoor, "id" | "name" | "name_ar">[];
  defaultUmoorId?: string;
}

export default function MessageForm({ umoors, defaultUmoorId }: Props) {
  const [success, setSuccess] = useState<{ ref: string } | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { to_umoor_id: defaultUmoorId ?? "" },
  });

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    const { error } = await supabase.from("messages").insert({
      sender_name:   data.sender_name,
      sender_its_id: data.sender_its_id,
      sender_phone:  data.sender_phone,
      to_umoor_id:   data.to_umoor_id,
      subject:       data.subject,
      message:       data.message,
      status:        "new",
    });
    if (error) { toast.error("Failed to send. Please try again."); return; }
    const ref = `MSG-${Date.now().toString(36).toUpperCase()}`;
    setSuccess({ ref });
    toast.success("Message sent successfully!");
  }

  if (success) {
    return (
      <div className="rounded-xl border bg-green-50 p-10 text-center"
        style={{ borderColor: "rgba(207,155,0,0.2)" }}>
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h3 className="font-heading font-bold text-xl mb-2" style={{ color: "var(--color-navy)" }}>
          Message Sent!
        </h3>
        <p className="text-gray-600 mb-4">
          Your message has been delivered to the umoor coordinator.
          You will be contacted on the phone number provided.
        </p>
        <p className="text-sm font-mono font-bold px-4 py-2 rounded-lg inline-block"
          style={{ background: "rgba(207,155,0,0.1)", color: "var(--color-gold-dark)" }}>
          Reference: {success.ref}
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => setSuccess(null)}>Send another message</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border bg-white p-6 space-y-5"
      style={{ borderColor: "rgba(207,155,0,0.2)" }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl" style={{ background: "var(--color-navy)" }}>
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg" style={{ color: "var(--color-navy)" }}>
            Contact Jamaat
          </h2>
          <p className="text-xs text-gray-400">Fill all fields and send your message.</p>
        </div>
      </div>

      {/* Umoor select */}
      <div className="space-y-1">
        <Label>Select Umoor / Department</Label>
        <Select onValueChange={(v) => { if (v) setValue("to_umoor_id", v); }} defaultValue={defaultUmoorId ?? null}>
          <SelectTrigger>
            <SelectValue placeholder="Choose umoor..." />
          </SelectTrigger>
          <SelectContent>
            {umoors.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} {u.name_ar ? `— ${u.name_ar}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.to_umoor_id && <p className="text-xs text-red-500">{errors.to_umoor_id.message}</p>}
        <input type="hidden" {...register("to_umoor_id")} />
      </div>

      {/* Personal info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="sender_name">Your Name</Label>
          <Input id="sender_name" placeholder="Full name" {...register("sender_name")} />
          {errors.sender_name && <p className="text-xs text-red-500">{errors.sender_name.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="sender_its_id">ITS ID</Label>
          <Input id="sender_its_id" placeholder="ITS number" {...register("sender_its_id")} />
          {errors.sender_its_id && <p className="text-xs text-red-500">{errors.sender_its_id.message}</p>}
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="sender_phone">Phone / WhatsApp</Label>
        <Input id="sender_phone" placeholder="+91 XXXXX XXXXX" {...register("sender_phone")} />
        {errors.sender_phone && <p className="text-xs text-red-500">{errors.sender_phone.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" placeholder="Brief subject..." {...register("subject")} />
        {errors.subject && <p className="text-xs text-red-500">{errors.subject.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" rows={5} placeholder="Write your message here..." {...register("message")} />
        {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full font-semibold"
        style={{ background: "var(--color-navy)", color: "white" }}>
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>
      <p className="text-xs text-center text-gray-400">
        Your contact details will only be used to respond to your message.
      </p>
    </form>
  );
}
