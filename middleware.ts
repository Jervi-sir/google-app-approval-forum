import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/middleware"

export async function middleware(req: NextRequest) {
  // Create an authenticated Supabase client
  // This helps us access the user and refresh the session if needed
  const { supabase, response } = createClient(req)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  // Define public routes
  // User requested: "except for ofc the auth and products and product page"
  // Note: Existing code uses "/posts" for the content, so we allow that too to prevent locking out "Just browsing".
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/posts") ||
    (pathname.startsWith("/api/posts") && req.method === "GET") ||
    (pathname.startsWith("/api/tags") && req.method === "GET")

  // If user is not signed in and the route is not public, redirect to signin
  if (!user && !isPublic) {
    const url = req.nextUrl.clone()
    url.pathname = "/auth/signin"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Allow the request to proceed (with updated cookies in response)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/assets extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
