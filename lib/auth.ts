import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types";

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, umoor_id, its_id, phone")
    .eq("id", user.id)
    .single();

  return data;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await getProfile();
  if (!profile) throw new Error("Unauthorized");
  if (!allowedRoles.includes(profile.role as UserRole)) {
    throw new Error("Forbidden");
  }
  return profile;
}

export function isAdmin(role: UserRole): boolean {
  return ["super_admin", "umoor_admin", "madrasa_admin", "booking_admin"].includes(role);
}

export function canAccessModule(role: UserRole, module: string): boolean {
  if (role === "super_admin") return true;
  const permissions: Record<string, UserRole[]> = {
    umoors:   ["umoor_admin"],
    madrasa:  ["madrasa_admin"],
    bookings: ["booking_admin"],
    ashara:   ["umoor_admin"],
    fmb:      ["umoor_admin"],
    events:   ["umoor_admin"],
    messages: ["umoor_admin", "madrasa_admin", "booking_admin"],
  };
  return permissions[module]?.includes(role) ?? false;
}
