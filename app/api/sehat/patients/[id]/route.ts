import { NextRequest, NextResponse } from "next/server";
import { isSehatAuthedReq } from "@/lib/sehat-auth";
import { getSehatClient } from "@/lib/supabase/sehat";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isSehatAuthedReq(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = getSehatClient();
  const { error } = await supabase.from("sehat_patients").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
