// middleware.ts
import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/middleware"

export async function middleware(req: NextRequest) {
  const { supabase, response } = createClient(req)

  const path = req.nextUrl.pathname

  // 1. Define Protected Routes
  const protectedPrefixes = [
    "/admin",
    "/profile",
    "/posts/upsert",
    "/posts/saved"
  ]

  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    path.startsWith(prefix)
  )

  // 2. Performance Optimization: 
  // Only call getUser if it's a protected route OR if there's an existing session cookie to refresh.
  // This avoids a slow network call to Supabase for guest users on public pages.
  const hasSessionCookie = req.cookies.getAll().some(c => c.name.startsWith('sb-'))

  if (isProtectedRoute || hasSessionCookie) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 3. Redirect if accessing a protected route without a user
    if (isProtectedRoute && !user) {
      const url = req.nextUrl.clone()
      url.pathname = "/auth/signin"
      url.searchParams.set("redirect", path)
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    // Apply to everything except API, static files, and images
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}