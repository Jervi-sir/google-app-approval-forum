import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Sign out
  await supabase.auth.signOut()

  const url = new URL(request.url)
  return NextResponse.redirect(`${url.origin}/`)
}
