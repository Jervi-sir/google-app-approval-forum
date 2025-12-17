// utils/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers, // IMPORTANT
    },
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // set on the request (so subsequent reads in this middleware see latest cookies)
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }

        // recreate response with headers (IMPORTANT)
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })

        // set cookies on response
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  return { supabase, response }
}
