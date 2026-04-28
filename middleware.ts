import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const protectedPrefixes = [
  "/dashboard",
  "/materials",
  "/bookings",
  "/clients",
  "/payments",
  "/invoices",
  "/documents",
  "/calendar",
  "/reports",
  "/owner-admin"
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isBlockedPage = pathname === "/blocked";

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, is_blocked, organization_id")
      .eq("id", user.id)
      .single();

    let shouldBlock = !profile || Boolean(profile.is_blocked);

    if (profile && profile.role !== "saas_owner") {
      const { data: activeOrg } = await supabase.rpc("has_active_org");
      shouldBlock = shouldBlock || !activeOrg;
    }

    if ((isProtected || isAuthPage) && shouldBlock && !isBlockedPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/blocked";
      url.searchParams.set("reason", profile?.is_blocked ? "user" : "organization");
      return NextResponse.redirect(url);
    }

    if (isAuthPage && !shouldBlock) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
