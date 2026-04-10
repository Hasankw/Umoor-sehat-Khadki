import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSehatAuthedReq } from "@/lib/sehat-auth";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  // Protect /sehat/admin/* with sehat_session cookie (independent of Supabase Auth)
  if (path.startsWith("/sehat/admin")) {
    if (!(await isSehatAuthedReq(request))) {
      return NextResponse.redirect(new URL("/sehat/login", request.url));
    }
    return supabaseResponse;
  }

  // Skip auth entirely if Supabase is not configured (dev without credentials)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured = supabaseUrl?.startsWith("http") && supabaseKey && supabaseKey.length > 20;

  if (!supabaseConfigured) {
    // No credentials — redirect admin to login, let everything else through
    if (path.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Protect /admin/* routes
  if (path.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Check role from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const adminRoles = ["super_admin", "umoor_admin", "madrasa_admin", "booking_admin"];
    if (!profile || !adminRoles.includes(profile.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protect member-only routes
  const memberRoutes = ["/madrasa/portal", "/bookings/my"];
  if (memberRoutes.some((r) => path.startsWith(r)) && !user) {
    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(path)}`, request.url)
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
