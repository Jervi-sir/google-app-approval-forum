import { NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { comments, posts, profiles, reports } from "@/drizzle/schema"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

const Roles = new Set(["user", "moderator", "admin"])

async function requireAdminOrMod() {
  const supabase = createClient(await cookies())
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const me = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, auth.user.id)).limit(1)
  const role = me[0]?.role
  if (role !== "admin" && role !== "moderator") {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { ok: true as const, actorId: auth.user.id, actorRole: role }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminOrMod()
  if (!gate.ok) return gate.res

  const { id } = await ctx.params

  const rows = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      email: profiles.email,
      image: profiles.avatarUrl,
      role: profiles.role,
      isVerified: profiles.isVerified,
      createdAt: profiles.createdAt,

      posts: sql<number>`coalesce(count(distinct ${posts.id}), 0)`.mapWith(Number),
      comments: sql<number>`coalesce(count(distinct ${comments.id}), 0)`.mapWith(Number),
      reportsMade: sql<number>`coalesce(count(distinct ${sql`rm.id`}), 0)`.mapWith(Number),
      reportsAgainst: sql<number>`coalesce(count(distinct ${sql`ra.id`}), 0)`.mapWith(Number),
    })
    .from(profiles)
    .leftJoin(posts, eq(posts.authorId, profiles.id))
    .leftJoin(comments, eq(comments.authorId, profiles.id))
    // aliasing with raw SQL to count both directions without a second query
    .leftJoin(sql`reports as rm`, sql`rm.reporter_id = ${profiles.id}`)
    .leftJoin(sql`reports as ra`, sql`ra.target_user_id = ${profiles.id}`)
    .where(eq(profiles.id, id))
    .groupBy(profiles.id)
    .limit(1)

  const u = rows[0]
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    id: u.id,
    name: u.name ?? "Unknown",
    email: u.email ?? "",
    image: u.image ?? null,
    role: u.role,
    isVerified: u.isVerified,
    createdAt: u.createdAt,
    stats: {
      posts: u.posts,
      comments: u.comments,
      reportsMade: u.reportsMade,
      reportsAgainst: u.reportsAgainst,
    },
  })
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminOrMod()
  if (!gate.ok) return gate.res

  const { id } = await ctx.params

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const patch: any = { updatedAt: new Date() }

  // name
  if (body?.name != null) {
    const name = String(body.name).trim()
    if (!name || name.length > 120) return NextResponse.json({ error: "Invalid name" }, { status: 400 })
    patch.name = name
  }

  // verification (mods allowed)
  if (body?.isVerified != null) {
    const isVerified = !!body.isVerified
    patch.isVerified = isVerified
    patch.verifiedAt = isVerified ? new Date() : null
    patch.verifiedById = isVerified ? gate.actorId : null
  }

  // role (admin only)
  if (body?.role != null) {
    if (gate.actorRole !== "admin") {
      return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 })
    }
    const role = String(body.role)
    if (!Roles.has(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    patch.role = role
  }

  if (Object.keys(patch).length <= 1) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const updated = await db.update(profiles).set(patch).where(eq(profiles.id, id)).returning({ id: profiles.id })
  if (!updated.length) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ ok: true })
}



