import { NextRequest, NextResponse } from "next/server";
import { isSehatAuthedReq } from "@/lib/sehat-auth";
import { getSehatClient, isSupabaseConfigured } from "@/lib/supabase/sehat";

const VALID_CATEGORIES = ["ortho", "examination", "physio", "dental", "other"] as const;
type Category = typeof VALID_CATEGORIES[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isSehatAuthedReq(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured())
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  try {
    const { id } = await params;
    const { category, done } = (await req.json()) as { category: Category; done: boolean };

    if (!VALID_CATEGORIES.includes(category))
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });

    const col = `${category}_done` as const;
    const supabase = getSehatClient();

    const { error } = await supabase
      .from("sehat_medical_records")
      .update({ [col]: done, updated_at: new Date().toISOString() })
      .eq("patient_id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
