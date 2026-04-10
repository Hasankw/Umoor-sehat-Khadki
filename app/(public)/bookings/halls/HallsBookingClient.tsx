"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import AvailabilityCalendar from "@/components/bookings/AvailabilityCalendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Facility } from "@/types";
import { Users, CheckCircle2 } from "lucide-react";

function makeSchema(maxCapacity: number) {
  return z.object({
    name:        z.string().min(2, "Name required"),
    its_id:      z.string().min(8, "ITS ID required"),
    phone:       z.string().min(10, "Phone required"),
    event_name:  z.string().min(2, "Event name required"),
    event_type:  z.string(),
    start_time:  z.string().min(1, "Start time required"),
    end_time:    z.string().min(1, "End time required"),
    attendees:   z.coerce.number().min(1).max(maxCapacity, `Max capacity: ${maxCapacity}`),
    notes:       z.string().optional(),
  }).refine((d) => d.end_time > d.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });
}
type FormData = z.infer<ReturnType<typeof makeSchema>>;

interface Props {
  facilities: Facility[];
  bookings: { date: string; status: "confirmed" | "pending"; facility_id: string }[];
}

export default function HallsBookingClient({ facilities, bookings }: Props) {
  const fakri  = facilities.find((f) => f.type === "hall_fakri");
  const shujai = facilities.find((f) => f.type === "hall_shujai");

  const [selectedHall,  setSelectedHall]  = useState<Facility | null>(fakri ?? null);
  const [selectedDate,  setSelectedDate]  = useState<Date | null>(null);
  const [step,          setStep]          = useState<"select" | "form" | "success">("select");
  const [submitted,     setSubmitted]     = useState<{ ref: string } | null>(null);

  const schema = makeSchema(selectedHall?.capacity ?? 9999);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { event_type: "other", attendees: 50 },
  });

  const bookedDates = bookings
    .filter((b) => b.facility_id === selectedHall?.id)
    .map((b) => ({ date: b.date, status: b.status }));

  async function onSubmit(data: FormData) {
    if (!selectedDate || !selectedHall) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ref = `HALL-${crypto.randomUUID().split("-")[0].toUpperCase()}`;

    const { error } = await supabase.from("bookings").insert({
      facility_id:     selectedHall.id,
      user_id:         user?.id ?? null,
      event_name:      data.event_name,
      event_type:      data.event_type,
      date:            format(selectedDate, "yyyy-MM-dd"),
      start_time:      data.start_time,
      end_time:        data.end_time,
      attendees:       data.attendees,
      notes:           data.notes ?? null,
      requester_name:  data.name,
      requester_its:   data.its_id,
      requester_phone: data.phone,
      ref,
      status:          "pending",
    });

    if (error) { toast.error("Booking failed: " + error.message); return; }
    setSubmitted({ ref });
    setStep("success");
    toast.success("Hall booking submitted!");
  }

  if (step === "success" && submitted) {
    return (
      <div className="rounded-xl border bg-green-50 p-10 text-center"
        style={{ borderColor: "rgba(207,155,0,0.2)" }}>
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h3 className="font-heading font-bold text-xl mb-2" style={{ color: "var(--color-navy)" }}>
          Hall Booking Submitted!
        </h3>
        <p className="text-gray-600 mb-4">
          Your request for <strong>{selectedHall?.name}</strong> on{" "}
          <strong>{selectedDate ? format(selectedDate, "d MMMM yyyy") : ""}</strong> is pending confirmation.
        </p>
        <p className="text-sm font-mono font-bold px-4 py-2 rounded-lg inline-block"
          style={{ background: "rgba(207,155,0,0.1)", color: "var(--color-gold-dark)" }}>
          Reference: {submitted.ref}
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => { setStep("select"); setSelectedDate(null); }}>
            Make another booking
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hall toggle */}
      <div className="flex gap-3 mb-8">
        {[fakri, shujai].filter(Boolean).map((hall) => (
          <button key={hall!.id}
            onClick={() => { setSelectedHall(hall!); setSelectedDate(null); setStep("select"); }}
            className={`flex-1 rounded-xl border p-4 text-left transition-all ${
              selectedHall?.id === hall!.id ? "border-amber-400 shadow-md" : "border-gray-200 hover:border-amber-200"
            }`}
            style={selectedHall?.id === hall!.id ? { background: "rgba(207,155,0,0.06)" } : {}}>
            <p className="font-heading font-bold" style={{ color: "var(--color-navy)" }}>{hall!.name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Users className="w-3 h-3" /> Capacity: {hall!.capacity}
            </p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{hall!.description}</p>
          </button>
        ))}
      </div>

      {selectedHall && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="font-medium text-sm mb-3" style={{ color: "var(--color-navy)" }}>
              {selectedDate ? `Selected: ${format(selectedDate, "EEEE, d MMMM yyyy")}` : "Select a date"}
            </p>
            <AvailabilityCalendar
              bookedDates={bookedDates}
              onSelectDate={(d) => { setSelectedDate(d); setStep("form"); }}
              selectedDate={selectedDate}
            />
          </div>

          {step === "form" && selectedDate && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="rounded-lg p-3 text-sm mb-1"
                style={{ background: "rgba(207,155,0,0.08)", color: "var(--color-navy)" }}>
                <strong>{selectedHall.name}</strong> · {format(selectedDate, "EEE, d MMM yyyy")}
              </div>
              {[
                { id: "name",       label: "Your Name",          placeholder: "Full name" },
                { id: "its_id",     label: "ITS ID",             placeholder: "8-digit ITS" },
                { id: "phone",      label: "Phone / WhatsApp",   placeholder: "+91 XXXXX XXXXX" },
                { id: "event_name", label: "Event Name",         placeholder: "e.g. Nikah, Aqeeqah, Meeting" },
              ].map((f) => (
                <div key={f.id} className="space-y-1">
                  <Label htmlFor={f.id}>{f.label}</Label>
                  <Input id={f.id} placeholder={f.placeholder} {...register(f.id as keyof FormData)} />
                  {errors[f.id as keyof FormData] && (
                    <p className="text-xs text-red-500">{(errors[f.id as keyof FormData] as {message?:string})?.message}</p>
                  )}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input id="start_time" type="time" {...register("start_time")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input id="end_time" type="time" {...register("end_time")} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="attendees">Expected Attendees</Label>
                <Input id="attendees" type="number" min={1} max={selectedHall.capacity} {...register("attendees")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" rows={2} {...register("notes")} />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full"
                style={{ background: "var(--color-navy)", color: "white" }}>
                {isSubmitting ? "Submitting..." : "Submit Booking Request"}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
