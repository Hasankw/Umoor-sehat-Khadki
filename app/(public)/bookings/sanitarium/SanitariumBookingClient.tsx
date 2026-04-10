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
import { CalendarDays, Send } from "lucide-react";

const schema = z.object({
  event_name:  z.string().min(2, "Name required"),
  attendees:   z.coerce.number().min(1).max(40),
  notes:       z.string().optional(),
  its_id:      z.string().min(8, "ITS ID required"),
  phone:       z.string().min(10, "Phone required"),
  check_in:    z.string(),
  check_out:   z.string(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  facilityId: string;
  bookedDates: { date: string; status: "confirmed" | "pending" }[];
}

export default function SanitariumBookingClient({ facilityId, bookedDates }: Props) {
  const [checkIn,   setCheckIn]   = useState<Date | null>(null);
  const [checkOut,  setCheckOut]  = useState<Date | null>(null);
  const [step,      setStep]      = useState<"select" | "form" | "success">("select");
  const [submitted, setSubmitted] = useState<{ ref: string } | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function handleDateSelect(date: Date) {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date);
      setCheckOut(null);
      setValue("check_in", format(date, "yyyy-MM-dd"));
    } else {
      if (date <= checkIn) {
        setCheckIn(date);
        setValue("check_in", format(date, "yyyy-MM-dd"));
        return;
      }
      setCheckOut(date);
      setValue("check_out", format(date, "yyyy-MM-dd"));
      setStep("form");
    }
  }

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ref = `SAN-${crypto.randomUUID().split("-")[0].toUpperCase()}`;

    const { error } = await supabase.from("bookings").insert({
      facility_id:     facilityId,
      user_id:         user?.id ?? null,
      event_name:      data.event_name,
      event_type:      "other",
      date:            data.check_in,
      checkout_date:   data.check_out,
      start_time:      "14:00",
      end_time:        "12:00",
      attendees:       data.attendees,
      notes:           data.notes ?? null,
      requester_name:  data.event_name,
      requester_its:   data.its_id,
      requester_phone: data.phone,
      ref,
      status:          "pending",
    });

    if (error) {
      toast.error("Booking failed: " + error.message);
      return;
    }
    setSubmitted({ ref });
    setStep("success");
    toast.success("Booking submitted successfully!");
  }

  if (step === "success" && submitted) {
    return (
      <div className="rounded-xl border bg-green-50 p-8 text-center"
        style={{ borderColor: "rgba(207,155,0,0.2)" }}>
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Send className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="font-heading font-bold text-xl mb-2" style={{ color: "var(--color-navy)" }}>
          Booking Request Submitted!
        </h3>
        <p className="text-gray-600 mb-4">
          Your booking is pending confirmation by the jamaat admin.
          You will be contacted on the phone number provided.
        </p>
        <p className="text-sm font-mono font-bold px-4 py-2 rounded-lg inline-block"
          style={{ background: "rgba(207,155,0,0.1)", color: "var(--color-gold-dark)" }}>
          Reference: {submitted.ref}
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => { setStep("select"); setCheckIn(null); setCheckOut(null); }}>
            Make another booking
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Calendar */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-4 h-4" style={{ color: "var(--color-gold)" }} />
          <p className="font-medium text-sm" style={{ color: "var(--color-navy)" }}>
            {!checkIn
              ? "Select check-in date"
              : !checkOut
              ? `Check-in: ${format(checkIn, "dd MMM")} — now select check-out`
              : `${format(checkIn, "dd MMM")} → ${format(checkOut, "dd MMM")}`}
          </p>
        </div>
        <AvailabilityCalendar
          bookedDates={bookedDates}
          onSelectDate={handleDateSelect}
          selectedDate={checkIn}
        />
      </div>

      {/* Form */}
      {step === "form" && checkIn && checkOut && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg p-3 text-sm mb-2"
            style={{ background: "rgba(207,155,0,0.08)", color: "var(--color-navy)" }}>
            Check-in: <strong>{format(checkIn, "EEE, d MMM yyyy")}</strong> →
            Check-out: <strong>{format(checkOut, "EEE, d MMM yyyy")}</strong>
          </div>

          <div className="space-y-1">
            <Label htmlFor="event_name">Full Name</Label>
            <Input id="event_name" placeholder="Your full name" {...register("event_name")} />
            {errors.event_name && <p className="text-xs text-red-500">{errors.event_name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="its_id">ITS ID</Label>
            <Input id="its_id" placeholder="8-digit ITS number" {...register("its_id")} />
            {errors.its_id && <p className="text-xs text-red-500">{errors.its_id.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone / WhatsApp</Label>
            <Input id="phone" placeholder="+91 XXXXX XXXXX" {...register("phone")} />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="attendees">No. of Guests</Label>
            <Input id="attendees" type="number" min={1} max={40} defaultValue={1} {...register("attendees")} />
            {errors.attendees && <p className="text-xs text-red-500">{errors.attendees.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" placeholder="Any special requirements..." rows={3} {...register("notes")} />
          </div>
          <input type="hidden" {...register("check_in")} />
          <input type="hidden" {...register("check_out")} />
          <Button type="submit" disabled={isSubmitting} className="w-full"
            style={{ background: "var(--color-navy)", color: "white" }}>
            {isSubmitting ? "Submitting..." : "Submit Booking Request"}
          </Button>
          <p className="text-xs text-gray-400 text-center">
            Bookings are subject to availability and admin confirmation.
          </p>
        </form>
      )}

      {step === "select" && !checkOut && (
        <div className="flex items-center justify-center rounded-xl border border-dashed p-8 text-center text-gray-400 text-sm"
          style={{ borderColor: "rgba(207,155,0,0.2)" }}>
          Select check-in and check-out dates on the calendar to proceed.
        </div>
      )}
    </div>
  );
}
