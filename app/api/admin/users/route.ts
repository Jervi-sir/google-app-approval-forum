import { NextResponse } from "next/server"
import { and, desc, eq, ilike, or, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { comments, posts, profiles, reports } from "@/drizzle/schema"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = Number(v)
  if (!Number.isFinite(n)) return def
  return Math.max(min, Math.min(max, Math.floor(n)))
}

async function requireAdminOrMod() {
  const supabase = createClient(await cookies())
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const me = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, auth.user.id)).limit(1)
  const role = me[0]?.role
  if (role !== "admin" && role !== "moderator") {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { ok: true as const }
}

export async function GET(req: Request) {
  const gate = await requireAdminOrMod()
  if (!gate.ok) return gate.res

  const url = new URL(req.url)
  const page = clampInt(url.searchParams.get("page"), 1, 1, 5000)
  const limit = clampInt(url.searchParams.get("limit"), 20, 1, 100)
  const q = (url.searchParams.get("q") ?? "").trim()

  const where = q
    ? or(
      ilike(sql`${profiles.id}::text`, `%${q}%`),
      ilike(sql`coalesce(${profiles.name}, '')`, `%${q}%`),
      ilike(sql`coalesce(${profiles.email}, '')`, `%${q}%`)
    )
    : undefined

  // list rows
  const items = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      email: profiles.email,
      role: profiles.role,
      isVerified: profiles.isVerified,
      createdAt: profiles.createdAt,

      postsCount: sql<number>`coalesce(count(distinct ${posts.id}), 0)`.mapWith(Number),
      reportsCount: sql<number>`coalesce(count(distinct ${reports.id}), 0)`.mapWith(Number),
    })
    .from(profiles)
    .leftJoin(posts, eq(posts.authorId, profiles.id))
    .leftJoin(reports, eq(reports.targetUserId, profiles.id)) // reports AGAINST user
    .where(where)
    .groupBy(profiles.id)
    .orderBy(desc(profiles.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  // total count for pagination
  const total = await db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(profiles)
    .where(where)
    .then((r) => r[0]?.total ?? 0)

  return NextResponse.json({
    items: items.map((u) => ({
      id: u.id,
      name: u.name ?? "Unknown",
      email: u.email ?? "",
      role: u.role,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
      postsCount: u.postsCount,
      reportsCount: u.reportsCount,
    })),
    page,
    limit,
    total,
    hasMore: page * limit < total,
  })
}
