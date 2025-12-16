import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/middleware"

function isPublic(req: NextRequest) {
  const { pathname } = req.nextUrl
  return (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/posts") ||
    (pathname.startsWith("/api/posts") && req.method === "GET") ||
    (pathname.startsWith("/api/tags") && req.method === "GET")
  )
}

function isAdminRoute(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin")
}

export async function middleware(req: NextRequest) {
  const { supabase, response } = createClient(req)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  // 1) Auth guard
  if (!user && !isPublic(req)) {
    const url = req.nextUrl.clone()
    url.pathname = "/auth/signin"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // If not logged in but public => ok (still return response for cookie refresh)
  if (!user) return response

  // 2) Admin guard
  if (isAdminRoute(pathname)) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    // Treat any error / missing profile as NOT admin
    if (error || !profile || profile.role !== "admin") {
      const url = req.nextUrl.clone()
      url.pathname = "/403" // make this page
      return NextResponse.redirect(url)
    }
  }

  // 3) Continue
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
