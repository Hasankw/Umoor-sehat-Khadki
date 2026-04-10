"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { MadrasaStudent, MadrasaAttendance, MadrasaResult, AttendanceStatus } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { UserPlus, CheckCircle2, XCircle, Clock, AlertCircle, Trash2 } from "lucide-react";

// ── Schemas ────────────────────────────────────────────────────────────────────
const studentSchema = z.object({
  its_id:          z.string().min(6),
  name:            z.string().min(2),
  class:           z.string().min(1),
  guardian_name:   z.string().min(2),
  guardian_phone:  z.string().min(10),
  guardian_its_id: z.string().min(6),
});
type StudentForm = z.infer<typeof studentSchema>;

const resultSchema = z.object({
  student_id: z.string().uuid(),
  exam_name:  z.string().min(2),
  marks:      z.coerce.number().min(0),
  total:      z.coerce.number().min(1),
  remarks:    z.string().optional(),
});
type ResultForm = z.infer<typeof resultSchema>;

const STATUS_ICON: Record<AttendanceStatus, React.ReactNode> = {
  present: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  absent:  <XCircle className="w-4 h-4 text-red-400" />,
  late:    <Clock className="w-4 h-4 text-yellow-500" />,
  excused: <AlertCircle className="w-4 h-4 text-blue-400" />,
};

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  students:   MadrasaStudent[];
  attendance: MadrasaAttendance[];
  results:    MadrasaResult[];
}

export default function MadrasaAdminClient({ students: initial, attendance: initAttend, results: initResults }: Props) {
  const [students,   setStudents]   = useState(initial);
  const [attendance, setAttendance] = useState(initAttend);
  const [results,    setResults]    = useState(initResults);
  const [attendDate, setAttendDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { register: regS, handleSubmit: handleS, reset: resetS, formState: { errors: errS, isSubmitting: subS } } =
    useForm<StudentForm>({ resolver: zodResolver(studentSchema) });

  const { register: regR, handleSubmit: handleR, reset: resetR, formState: { errors: errR, isSubmitting: subR } } =
    useForm<ResultForm>({ resolver: zodResolver(resultSchema) });

  // ── Student CRUD ────────────────────────────────────────────────────────────
  async function addStudent(data: StudentForm) {
    const supabase = createClient();
    const { data: s, error } = await supabase.from("madrasa_students").insert({
      ...data,
      enrollment_date: format(new Date(), "yyyy-MM-dd"),
      active: true,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setStudents([s as MadrasaStudent, ...students]);
    resetS();
    toast.success("Student enrolled");
  }

  async function toggleActive(s: MadrasaStudent) {
    const supabase = createClient();
    await supabase.from("madrasa_students").update({ active: !s.active }).eq("id", s.id);
    setStudents(students.map((st) => st.id === s.id ? { ...st, active: !st.active } : st));
    toast.success(s.active ? "Student deactivated" : "Student reactivated");
  }

  // ── Attendance ───────────────────────────────────────────────────────────────
  const attendanceForDate = attendance.filter((a) => a.date === attendDate);

  async function markAttendance(studentId: string, status: AttendanceStatus) {
    const supabase = createClient();
    const existing = attendanceForDate.find((a) => a.student_id === studentId);
    if (existing) {
      await supabase.from("madrasa_attendance").update({ status }).eq("id", existing.id);
      setAttendance(attendance.map((a) => a.id === existing.id ? { ...a, status } : a));
    } else {
      const { data, error } = await supabase.from("madrasa_attendance").insert({
        student_id: studentId, date: attendDate, status,
      }).select().single();
      if (error) { toast.error(error.message); return; }
      setAttendance([...attendance, data as MadrasaAttendance]);
    }
    toast.success("Attendance saved");
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  async function addResult(data: ResultForm) {
    const supabase = createClient();
    const { data: r, error } = await supabase.from("madrasa_results").insert(data).select().single();
    if (error) { toast.error(error.message); return; }
    setResults([r as MadrasaResult, ...results]);
    resetR();
    toast.success("Result added");
  }

  async function deleteResult(id: string) {
    const supabase = createClient();
    await supabase.from("madrasa_results").delete().eq("id", id);
    setResults(results.filter((r) => r.id !== id));
    toast.success("Result deleted");
  }

  const activeStudents = students.filter((s) => s.active);

  return (
    <Tabs defaultValue="students">
      <TabsList className="mb-6">
        <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
        <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
      </TabsList>

      {/* ── Students Tab ── */}
      <TabsContent value="students">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enroll form */}
          <div>
            <h3 className="font-heading font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--color-navy)" }}>
              <UserPlus className="w-4 h-4" /> Enroll New Student
            </h3>
            <form onSubmit={handleS(addStudent)}
              className="rounded-xl border bg-white p-5 space-y-3"
              style={{ borderColor: "rgba(207,155,0,0.2)" }}>
              {[
                { id: "name",            label: "Full Name",         pl: "Student full name" },
                { id: "its_id",          label: "ITS ID",            pl: "8-digit ITS" },
                { id: "class",           label: "Class / Grade",     pl: "e.g. Class 3" },
                { id: "guardian_name",   label: "Guardian Name",     pl: "Father / guardian name" },
                { id: "guardian_its_id", label: "Guardian ITS",      pl: "Guardian ITS ID" },
                { id: "guardian_phone",  label: "Guardian Phone",    pl: "+91 XXXXX XXXXX" },
              ].map((f) => (
                <div key={f.id} className="space-y-1">
                  <Label>{f.label}</Label>
                  <Input placeholder={f.pl} {...regS(f.id as keyof StudentForm)} />
                  {errS[f.id as keyof StudentForm] && (
                    <p className="text-xs text-red-500">{errS[f.id as keyof StudentForm]?.message}</p>
                  )}
                </div>
              ))}
              <Button type="submit" disabled={subS} style={{ background: "var(--color-navy)", color: "white" }}>
                {subS ? "Enrolling..." : "Enroll Student"}
              </Button>
            </form>
          </div>

          {/* Student list */}
          <div>
            <h3 className="font-heading font-semibold mb-3" style={{ color: "var(--color-navy)" }}>
              All Students
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {students.map((s) => (
                <div key={s.id}
                  className={`rounded-xl border p-4 ${s.active ? "bg-white" : "bg-gray-50 opacity-60"}`}
                  style={{ borderColor: "rgba(207,155,0,0.15)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>{s.name}</p>
                      <p className="text-xs text-gray-500">ITS: {s.its_id} · {s.class}</p>
                      <p className="text-xs text-gray-400">Guardian: {s.guardian_name} · {s.guardian_phone}</p>
                      <p className="text-xs text-gray-300 mt-0.5">Enrolled: {format(parseISO(s.enrollment_date), "d MMM yyyy")}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                        {s.active ? "Active" : "Inactive"}
                      </span>
                      <button onClick={() => toggleActive(s)}
                        className="text-xs hover:underline"
                        style={{ color: "var(--color-gold-dark)" }}>
                        {s.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TabsContent>

      {/* ── Attendance Tab ── */}
      <TabsContent value="attendance">
        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "rgba(207,155,0,0.2)" }}>
          <div className="px-6 py-4 border-b flex items-center gap-4 flex-wrap" style={{ borderColor: "rgba(207,155,0,0.1)" }}>
            <h3 className="font-heading font-semibold" style={{ color: "var(--color-navy)" }}>
              Mark Attendance
            </h3>
            <Input type="date" value={attendDate} onChange={(e) => setAttendDate(e.target.value)}
              className="w-40 text-sm" />
            <p className="text-xs text-gray-400 ml-auto">
              {attendanceForDate.filter((a) => a.status === "present").length}/{activeStudents.length} present
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Class</th>
                  {(["present","absent","late","excused"] as AttendanceStatus[]).map((s) => (
                    <th key={s} className="px-3 py-3 text-center text-xs font-medium text-gray-500 capitalize">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeStudents.map((s) => {
                  const record = attendanceForDate.find((a) => a.student_id === s.id);
                  return (
                    <tr key={s.id} className="border-t border-gray-50">
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--color-navy)" }}>
                        {s.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.class}</td>
                      {(["present","absent","late","excused"] as AttendanceStatus[]).map((status) => (
                        <td key={status} className="px-3 py-3 text-center">
                          <button
                            onClick={() => markAttendance(s.id, status)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all ${
                              record?.status === status
                                ? "ring-2 ring-offset-1"
                                : "opacity-30 hover:opacity-70"
                            }`}
                            style={record?.status === status ? { outline: "2px solid var(--color-gold)" } : {}}>
                            {STATUS_ICON[status]}
                          </button>
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {activeStudents.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No active students.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>

      {/* ── Results Tab ── */}
      <TabsContent value="results">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add result */}
          <div>
            <h3 className="font-heading font-semibold mb-3" style={{ color: "var(--color-navy)" }}>Add Result</h3>
            <form onSubmit={handleR(addResult)}
              className="rounded-xl border bg-white p-5 space-y-3"
              style={{ borderColor: "rgba(207,155,0,0.2)" }}>
              <div className="space-y-1">
                <Label>Student</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm"
                  style={{ borderColor: "rgba(207,155,0,0.3)" }}
                  {...regR("student_id")}>
                  <option value="">Select student...</option>
                  {activeStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                  ))}
                </select>
                {errR.student_id && <p className="text-xs text-red-500">{errR.student_id.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Exam Name</Label>
                <Input placeholder="e.g. Monthly Test, Annual Exam" {...regR("exam_name")} />
                {errR.exam_name && <p className="text-xs text-red-500">{errR.exam_name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Marks Obtained</Label>
                  <Input type="number" min={0} {...regR("marks")} />
                </div>
                <div className="space-y-1">
                  <Label>Total Marks</Label>
                  <Input type="number" min={1} {...regR("total")} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Remarks (optional)</Label>
                <Input placeholder="e.g. Excellent, Needs improvement" {...regR("remarks")} />
              </div>
              <Button type="submit" disabled={subR} style={{ background: "var(--color-navy)", color: "white" }}>
                {subR ? "Adding..." : "Add Result"}
              </Button>
            </form>
          </div>

          {/* Results list */}
          <div>
            <h3 className="font-heading font-semibold mb-3" style={{ color: "var(--color-navy)" }}>
              Recent Results ({results.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No results recorded yet.</p>
              ) : results.map((r) => {
                const student = students.find((s) => s.id === r.student_id);
                const pct     = Math.round((r.marks / r.total) * 100);
                return (
                  <div key={r.id} className="rounded-xl border bg-white p-4 flex items-start justify-between gap-3"
                    style={{ borderColor: "rgba(207,155,0,0.15)" }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>
                        {student?.name ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500">{r.exam_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.marks}/{r.total} ({pct}%)
                        {r.remarks && ` · ${r.remarks}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-bold ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                        {pct}%
                      </span>
                      <button onClick={() => deleteResult(r.id)} className="p-1 rounded hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
