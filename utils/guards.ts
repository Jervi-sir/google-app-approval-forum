// utils/guards.ts
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { eq } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { profiles } from "@/drizzle/schema"
import { cookies } from "next/headers"

/**
 * Checks if user is Admin. 
 * If NOT, redirects to 403.
 * If YES, returns the user object.
 */
export async function requireAdmin() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  // Note: Middleware already checked for 'user', but we check again for type safety
  if (!user) redirect("/auth/signin")

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
    columns: { role: true },
  })

  if (profile?.role !== "admin") {
    redirect("/403") // or "/"
  }

  return user
}