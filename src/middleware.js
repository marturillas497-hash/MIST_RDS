import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // If no user, only allow public routes
  if (!user) {
    const publicRoutes = ["/login", "/register", "/pending"];
    if (!publicRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  // User is logged in — fetch their profile once
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  // If no profile found, sign them out and send to login
  if (!profile) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Block suspended/rejected accounts
  if (profile.status === "rejected" || profile.status === "suspended") {
    return NextResponse.redirect(new URL("/login?error=account_suspended", request.url));
  }

  // Pending advisers can only see /pending
  if (profile.role === "research_adviser" && profile.status === "pending") {
    if (pathname !== "/pending") {
      return NextResponse.redirect(new URL("/pending", request.url));
    }
    return supabaseResponse;
  }

  // Logged-in users should not see auth pages
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.redirect(new URL(getRoleHome(profile.role), request.url));
  }

  // Root redirect
  if (pathname === "/") {
    return NextResponse.redirect(new URL(getRoleHome(profile.role), request.url));
  }

  // Role-based route protection
  if (pathname.startsWith("/admin") && profile.role !== "admin") {
    return NextResponse.redirect(new URL(getRoleHome(profile.role), request.url));
  }

  if (pathname.startsWith("/adviser") && profile.role !== "research_adviser") {
    return NextResponse.redirect(new URL(getRoleHome(profile.role), request.url));
  }

  // /dashboard/report/[id] is accessible to all roles
  // the rest of /dashboard, /submit, and /profile are student-only
  const isReportPage = pathname.startsWith("/dashboard/report");
  if (
    !isReportPage &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/submit") ||
      pathname.startsWith("/profile")) &&
    profile.role !== "student"
  ) {
    return NextResponse.redirect(new URL(getRoleHome(profile.role), request.url));
  }

  return supabaseResponse;
}

function getRoleHome(role) {
  switch (role) {
    case "admin":
      return "/admin";
    case "research_adviser":
      return "/adviser";
    default:
      return "/dashboard";
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};