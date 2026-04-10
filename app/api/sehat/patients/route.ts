import { NextRequest, NextResponse } from "next/server";
import { isSehatAuthedReq } from "@/lib/sehat-auth";
import { getSehatClient, isSupabaseConfigured } from "@/lib/supabase/sehat";

export async function GET(req: NextRequest) {
  if (!(await isSehatAuthedReq(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Database not configured. Set Supabase env vars." }, { status: 503 });

  try {
    const supabase = getSehatClient();
    const { data, error } = await supabase
      .from("sehat_patients")
      .select(`*, sehat_medical_records(
        id,
        token_ortho, token_ortho_number, ortho_done,
        token_examination, token_examination_number, examination_done,
        token_physio, token_physio_number, physio_done,
        token_dental, token_dental_number, dental_done,
        token_other, token_other_label, token_other_number, other_done
      )`)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isSehatAuthedReq(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Database not configured. Set Supabase env vars." }, { status: 503 });

  try {
    const body = await req.json().catch(() => ({})) as {
      name: string;
      its_number: string;
      age: number;
      contact: string;
      camp_year?: string;
      tokens: {
        ortho: boolean;
        examination: boolean;
        physio: boolean;
        dental: boolean;
        other: boolean;
        other_label?: string;
      };
    };

    const supabase = getSehatClient();
    const campYear = body.camp_year ?? "1448";

    // Insert patient
    const { data: patient, error: pErr } = await supabase
      .from("sehat_patients")
      .insert({
        name: body.name,
        its_number: body.its_number,
        age: body.age,
        contact: body.contact,
        camp_year: campYear,
      })
      .select("id")
      .single();

    if (pErr || !patient) return NextResponse.json({ error: pErr?.message ?? "Insert failed" }, { status: 500 });

    // Assign tokens atomically per selected category
    const categories = [
      { key: "ortho",       selected: body.tokens.ortho },
      { key: "examination", selected: body.tokens.examination },
      { key: "physio",      selected: body.tokens.physio },
      { key: "dental",      selected: body.tokens.dental },
      { key: "other",       selected: body.tokens.other },
    ] as const;

    const tokenNumbers: Record<string, number | null> = {};
    for (const cat of categories) {
      if (cat.selected) {
        const { data: num, error: tErr } = await supabase.rpc("assign_sehat_token", {
          p_category: cat.key,
          p_camp_year: campYear,
        });
        if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
        tokenNumbers[cat.key] = num as number;
      } else {
        tokenNumbers[cat.key] = null;
      }
    }

    // Create blank medical record with token assignments
    const { data: record, error: rErr } = await supabase
      .from("sehat_medical_records")
      .insert({
        patient_id:               patient.id,
        token_ortho:              body.tokens.ortho,
        token_ortho_number:       tokenNumbers["ortho"],
        token_examination:        body.tokens.examination,
        token_examination_number: tokenNumbers["examination"],
        token_physio:             body.tokens.physio,
        token_physio_number:      tokenNumbers["physio"],
        token_dental:             body.tokens.dental,
        token_dental_number:      tokenNumbers["dental"],
        token_other:              body.tokens.other,
        token_other_label:        body.tokens.other_label ?? null,
        token_other_number:       tokenNumbers["other"],
      })
      .select("id")
      .single();

    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

    return NextResponse.json({ patient_id: patient.id, record_id: record.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
