// middleware.ts
import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/middleware"

export async function middleware(req: NextRequest) {
  const { supabase, response } = createClient(req)

  // 1. Get User
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = req.nextUrl.pathname

  // 2. Define Protected Routes
  // These are routes that strictly require a logged-in user
  const protectedPrefixes = [
    "/admin",
    "/profile",
    "/posts/upsert",
    "/posts/saved"
  ]

  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    path.startsWith(prefix)
  )

  // 3. Redirect if accessing a protected route without a user
  if (isProtectedRoute && !user) {
    const url = req.nextUrl.clone()
    url.pathname = "/auth/signin"
    // Keep the original URL to redirect back after login
    url.searchParams.set("redirect", path)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    // Apply to everything except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}