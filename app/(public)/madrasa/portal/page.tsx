import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MadrasaStudent, MadrasaAttendance, MadrasaResult, MadrasaActivity } from "@/types";
import { format, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Madrasa Portal — Student Dashboard" };

const AttendanceIcon = ({ status }: { status: string }) => {
  if (status === "present")  return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (status === "absent")   return <XCircle className="w-4 h-4 text-red-500" />;
  if (status === "late")     return <Clock className="w-4 h-4 text-yellow-500" />;
  return <AlertCircle className="w-4 h-4 text-gray-400" />;
};

export default async function MadrasaPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/madrasa/portal");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.its_id) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border p-8 text-center max-w-md"
          style={{ borderColor: "rgba(207,155,0,0.2)" }}>
          <h2 className="font-heading font-bold text-xl mb-2" style={{ color: "var(--color-navy)" }}>
            ITS ID Not Set
          </h2>
          <p className="text-gray-500 text-sm">
            Your ITS ID is not linked to this account. Contact the madrasa admin.
          </p>
        </div>
      </div>
    );
  }

  const { data: students } = await supabase
    .from("madrasa_students")
    .select("*")
    .eq("guardian_its_id", profile.its_id)
    .eq("active", true);

  if (!students || students.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border p-8 text-center max-w-md"
          style={{ borderColor: "rgba(207,155,0,0.2)" }}>
          <h2 className="font-heading font-bold text-xl mb-2" style={{ color: "var(--color-navy)" }}>
            No Students Found
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            No active madrasa students found for ITS ID <strong>{profile.its_id}</strong>.
            Contact madrasa admin to register your child.
          </p>
          <Link href="/contacts" className="text-sm font-medium hover:underline"
            style={{ color: "var(--color-gold-dark)" }}>Contact Admin →</Link>
        </div>
      </div>
    );
  }

  // Load data for all students
  const studentIds = (students as MadrasaStudent[]).map((s) => s.id);
  const [attendanceRes, resultsRes, activitiesRes] = await Promise.all([
    supabase.from("madrasa_attendance").select("*").in("student_id", studentIds).order("date", { ascending: false }).limit(60),
    supabase.from("madrasa_results").select("*").in("student_id", studentIds).order("created_at", { ascending: false }),
    supabase.from("madrasa_activities").select("*").order("date", { ascending: false }).limit(6),
  ]);

  const allAttendance = (attendanceRes.data || []) as MadrasaAttendance[];
  const allResults    = (resultsRes.data    || []) as MadrasaResult[];
  const activities    = (activitiesRes.data || []) as MadrasaActivity[];

  return (
    <div className="min-h-screen bg-cream">
      <div className="py-10 px-4" style={{ background: "var(--color-navy)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="h-1 w-12 rounded mb-4" style={{ background: "var(--color-gold)" }} />
          <h1 className="font-heading font-bold text-2xl text-white mb-1">Madrasa Portal</h1>
          <p className="text-white/60 text-sm">Welcome, {profile.full_name}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {(students as MadrasaStudent[]).map((student) => {
          const attendance = allAttendance.filter((a) => a.student_id === student.id);
          const results    = allResults.filter((r) => r.student_id === student.id);
          const present    = attendance.filter((a) => a.status === "present").length;
          const pct        = attendance.length ? Math.round((present / attendance.length) * 100) : 0;

          return (
            <div key={student.id} className="mb-8">
              <div className="rounded-xl border bg-white p-5 mb-4"
                style={{ borderColor: "rgba(207,155,0,0.2)" }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="font-heading font-bold text-lg" style={{ color: "var(--color-navy)" }}>
                      {student.name}
                    </h2>
                    <p className="text-sm text-gray-500">Class: {student.class} · ITS: {student.its_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: pct >= 75 ? "var(--color-gold-dark)" : "red" }}>
                      {pct}%
                    </p>
                    <p className="text-xs text-gray-400">Attendance</p>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="attendance">
                <TabsList className="mb-4">
                  <TabsTrigger value="attendance">Attendance ({attendance.length})</TabsTrigger>
                  <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
                  <TabsTrigger value="activities">Activities</TabsTrigger>
                </TabsList>

                <TabsContent value="attendance">
                  <div className="rounded-xl border bg-white overflow-hidden"
                    style={{ borderColor: "rgba(207,155,0,0.15)" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ background: "var(--color-navy)", color: "white" }}>
                          <th className="px-4 py-2 text-left font-medium">Date</th>
                          <th className="px-4 py-2 text-left font-medium">Status</th>
                          <th className="px-4 py-2 text-left font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.length === 0 ? (
                          <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No attendance records</td></tr>
                        ) : attendance.slice(0, 20).map((a) => (
                          <tr key={a.id} className="border-t border-gray-50">
                            <td className="px-4 py-2.5 text-gray-600">
                              {format(parseISO(a.date), "EEE, d MMM yyyy")}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <AttendanceIcon status={a.status} />
                                <span className="capitalize text-xs">{a.status}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-gray-400 text-xs">{a.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="results">
                  <div className="space-y-3">
                    {results.length === 0 ? (
                      <p className="text-center text-gray-400 py-8">No exam results yet.</p>
                    ) : results.map((r) => (
                      <div key={r.id} className="rounded-xl border bg-white p-4 flex items-center justify-between"
                        style={{ borderColor: "rgba(207,155,0,0.15)" }}>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>{r.exam_name}</p>
                          {r.remarks && <p className="text-xs text-gray-400 mt-0.5">{r.remarks}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: "var(--color-navy)" }}>
                            {r.marks}<span className="text-gray-400 text-sm font-normal">/{r.total}</span>
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {Math.round((r.marks / r.total) * 100)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="activities">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activities.length === 0 ? (
                      <p className="text-gray-400 py-8 col-span-2 text-center">No activities posted.</p>
                    ) : activities.map((a) => (
                      <div key={a.id} className="rounded-xl border bg-white p-4"
                        style={{ borderColor: "rgba(207,155,0,0.15)" }}>
                        <p className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>{a.title}</p>
                        <p className="text-xs text-gray-400">{format(parseISO(a.date), "d MMM yyyy")}</p>
                        <p className="text-xs text-gray-500 mt-1">{a.description}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          );
        })}
      </div>
    </div>
  );
}
