import { NextResponse } from "next/server"
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { posts, postTags, profiles, tags } from "@/drizzle/schema"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = Number(v)
  if (!Number.isFinite(n)) return def
  return Math.max(min, Math.min(max, Math.floor(n)))
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
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
  return { ok: true as const, userId: auth.user.id }
}

export async function GET(req: Request) {
  const gate = await requireAdminOrMod()
  if (!gate.ok) return gate.res

  const url = new URL(req.url)
  const page = clampInt(url.searchParams.get("page"), 1, 1, 5000)
  const limit = clampInt(url.searchParams.get("limit"), 20, 1, 100)
  const q = (url.searchParams.get("q") ?? "").trim()

  const where = q ? or(ilike(tags.name, `%${q}%`), ilike(tags.slug, `%${q}%`)) : undefined

  const [items, total] = await Promise.all([
    db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        createdAt: tags.createdAt,
        postsCount: sql<number>`coalesce(count(distinct ${posts.id}), 0)`.mapWith(Number),
      })
      .from(tags)
      .leftJoin(postTags, eq(postTags.tagId, tags.id))
      .leftJoin(posts, and(eq(posts.id, postTags.postId), eq(posts.isDeleted, false)))
      .where(where)
      .groupBy(tags.id)
      .orderBy(asc(tags.slug))
      .limit(limit)
      .offset((page - 1) * limit),

    db
      .select({ total: sql<number>`count(*)`.mapWith(Number) })
      .from(tags)
      .where(where)
      .then((r) => r[0]?.total ?? 0),
  ])

  return NextResponse.json({
    items: items.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      postsCount: t.postsCount,
      createdAt: t.createdAt,
    })),
    page,
    limit,
    total,
    hasMore: page * limit < total,
  })
}

export async function POST(req: Request) {
  const gate = await requireAdminOrMod()
  if (!gate.ok) return gate.res

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const name = String(body?.name ?? "").trim()
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })
  if (name.length > 48) return NextResponse.json({ error: "Name too long (max 48)" }, { status: 400 })

  const slugRaw = String(body?.slug ?? "").trim()
  const slug = slugify(slugRaw || name)
  if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 })
  if (slug.length > 64) return NextResponse.json({ error: "Slug too long (max 64)" }, { status: 400 })

  // enforce uniqueness (you have unique index on slug)
  const exists = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1)
  if (exists.length) return NextResponse.json({ error: "Slug already exists" }, { status: 409 })

  const created = await db
    .insert(tags)
    .values({ name, slug })
    .returning({ id: tags.id, name: tags.name, slug: tags.slug, createdAt: tags.createdAt })

  return NextResponse.json({ ok: true, tag: created[0] })
}
