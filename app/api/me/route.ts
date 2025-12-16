import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { profiles } from "@/drizzle/schema"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  const supabase = createClient(await cookies())
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const p = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      email: profiles.email,
      image: profiles.avatarUrl,
      role: profiles.role,
      isVerified: profiles.isVerified,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.id, auth.user.id))
    .limit(1)
    .then((r) => r[0] ?? null)

  // fallback to auth metadata if profile row missing
  const u = auth.user
  return NextResponse.json({
    id: u.id,
    name: p?.name ?? u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "User",
    email: p?.email ?? u.email ?? "",
    image: p?.image ?? u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? null,
    role: p?.role ?? "user",
    isVerified: p?.isVerified ?? false,
    createdAt: (p?.createdAt ?? u.created_at) as any,
  })
}
