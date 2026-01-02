// utils/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Define Protected Routes
  const path = request.nextUrl.pathname
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
  const hasSessionCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

  if (isProtectedRoute || hasSessionCookie) {
    // SECURITY: Use getUser() for protected routes. 
    // For others, getSession() is faster and still triggers refresh if needed.

    // Safeguard: Wrap the auth call in a timeout to prevent the whole middleware from timing out.
    // If it takes > 2s, we fall back to null user and proceed.
    const authPromise = isProtectedRoute
      ? supabase.auth.getUser()
      : supabase.auth.getSession();

    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ data: { user: null, session: null }, error: new Error('Auth Timeout') }), 2000)
    );

    const result = await Promise.race([authPromise, timeoutPromise]) as {
      data: { user?: any; session?: { user: any } };
      error?: any;
    };
    const user = isProtectedRoute ? result.data?.user : result.data?.session?.user;


    // 3. Redirect if accessing a protected route without a user
    if (isProtectedRoute && !user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/signin"
      url.searchParams.set("redirect", path)
      return NextResponse.redirect(url)
    }
  }


  return response
}

