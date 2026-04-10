// ── AUTH & USERS ──────────────────────────────────────────────────────────────
export type UserRole =
  | "super_admin"
  | "umoor_admin"
  | "madrasa_admin"
  | "booking_admin"
  | "member"
  | "public";

export interface Profile {
  id: string;
  its_id: string;
  full_name: string;
  role: UserRole;
  umoor_id?: string;
  phone?: string;
}

// ── UMOORS ────────────────────────────────────────────────────────────────────
export interface Umoor {
  id: string;
  name: string;
  name_ar: string;
  name_lisan: string;
  description: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  icon: string;
  display_order: number;
}

// ── FACILITIES & BOOKINGS ─────────────────────────────────────────────────────
export type FacilityType = "sanitarium" | "hall_fakri" | "hall_shujai";
export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  capacity: number;
  description: string;
  amenities: string[];
}

export interface Booking {
  id: string;
  facility_id: string;
  user_id: string;
  event_name: string;
  event_type: string;
  date: string;
  start_time: string;
  end_time: string;
  attendees: number;
  status: BookingStatus;
  notes?: string;
  created_at: string;
  facility?: Facility;
}

// ── MADRASA ───────────────────────────────────────────────────────────────────
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface MadrasaStudent {
  id: string;
  its_id: string;
  name: string;
  class: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_its_id: string;
  enrollment_date: string;
  active: boolean;
}

export interface MadrasaAttendance {
  id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface MadrasaResult {
  id: string;
  student_id: string;
  exam_name: string;
  marks: number;
  total: number;
  remarks?: string;
}

export interface MadrasaActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  image_url?: string;
}

// ── FMB ───────────────────────────────────────────────────────────────────────
export type MealType = "breakfast" | "nashta" | "lunch" | "dinner";

export interface FmbMenu {
  id: string;
  date: string;
  meal_type: MealType;
  items: string[];
  notes?: string;
  created_at: string;
}

// ── MIQAAT & EVENTS ───────────────────────────────────────────────────────────
export type MiqaatCategory = "eid" | "urus" | "ayyam" | "other";

export interface MiqaatDate {
  id: string;
  title: string;
  title_ar: string;
  hijri_date: string;
  gregorian_date: string;
  description?: string;
  category: MiqaatCategory;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time?: string;
  location?: string;
  umoor_id?: string;
  image_url?: string;
  is_public: boolean;
  created_at: string;
  umoor?: Umoor;
}

// ── ASHARA ────────────────────────────────────────────────────────────────────
export type AsharaStatus = "upcoming" | "live" | "completed";
export type PreparationCategory = "accommodation" | "transport" | "parking" | "essentials";

export interface AsharaConfig {
  id: string;
  year: number;
  location: string;
  start_date: string;
  end_date: string;
  venue_name: string;
  venue_address: string;
  google_maps_url?: string;
  status: AsharaStatus;
}

export interface AsharaScheduleDay {
  id: string;
  ashara_config_id: string;
  day_number: number;
  date: string;
  waaz_time: string;
  namaaz_times: {
    fajr: string;
    zohr_asr: string;
    maghrib_isha: string;
  };
  special_notes?: string;
}

export interface AsharaUpdate {
  id: string;
  ashara_config_id: string;
  title: string;
  body: string;
  posted_at: string;
  pinned: boolean;
}

export interface AsharaPreparation {
  id: string;
  ashara_config_id: string;
  category: PreparationCategory;
  title: string;
  description: string;
  status: string;
  display_order: number;
}

// ── MESSAGES & ANNOUNCEMENTS ──────────────────────────────────────────────────
export type MessageStatus = "new" | "read" | "replied";

export interface Message {
  id: string;
  sender_name: string;
  sender_its_id: string;
  sender_phone: string;
  to_umoor_id: string;
  subject: string;
  message: string;
  status: MessageStatus;
  replied_at?: string;
  reply?: string;
  created_at: string;
  umoor?: Umoor;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: number;
  active: boolean;
  expires_at?: string;
  created_at: string;
}
