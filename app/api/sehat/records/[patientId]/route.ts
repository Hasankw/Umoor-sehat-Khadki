import { NextRequest, NextResponse } from "next/server";
import { isSehatAuthedReq } from "@/lib/sehat-auth";
import { getSehatClient, isSupabaseConfigured } from "@/lib/supabase/sehat";

export async function GET(req: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  if (!(await isSehatAuthedReq(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const { patientId } = await params;
    const supabase = getSehatClient();
    const { data, error } = await supabase
      .from("sehat_medical_records")
      .select("*")
      .eq("patient_id", patientId)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  if (!(await isSehatAuthedReq(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const { patientId } = await params;
    const body = await req.json().catch(() => ({}));
    const supabase = getSehatClient();
    const { data, error } = await supabase
      .from("sehat_medical_records")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("patient_id", patientId)
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
