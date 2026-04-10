import { NextRequest, NextResponse } from "next/server";
import { isSehatAuthedReq } from "@/lib/sehat-auth";
import { getSehatClient, isSupabaseConfigured } from "@/lib/supabase/sehat";

// POST /api/sehat/reset  body: { type: "tokens" | "queue", camp_year?: string }
export async function POST(req: NextRequest) {
  if (!(await isSehatAuthedReq(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured())
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  try {
    const { type, camp_year = "1448" } = (await req.json()) as {
      type: "tokens" | "queue";
      camp_year?: string;
    };

    const supabase = getSehatClient();

    if (type === "tokens") {
      // Reset all token counters to 0
      const { error } = await supabase
        .from("sehat_token_counters")
        .update({ current_no: 0 })
        .eq("camp_year", camp_year);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (type === "queue") {
      // Reset all done flags for patients in this camp year
      // Get patient IDs for this camp year first
      const { data: patients, error: pErr } = await supabase
        .from("sehat_patients")
        .select("id")
        .eq("camp_year", camp_year);
      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

      const ids = (patients ?? []).map((p: { id: string }) => p.id);
      if (ids.length > 0) {
        const { error } = await supabase
          .from("sehat_medical_records")
          .update({
            ortho_done: false,
            examination_done: false,
            physio_done: false,
            dental_done: false,
            other_done: false,
            updated_at: new Date().toISOString(),
          })
          .in("patient_id", ids);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
