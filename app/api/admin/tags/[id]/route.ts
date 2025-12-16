import { NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { postTags, profiles, tags } from "@/drizzle/schema"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

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

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminOrMod()
  if (!gate.ok) return gate.res

  const { id } = await ctx.params

  // block deletion if tag is used
  const used = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(postTags)
    .where(eq(postTags.tagId, id))
    .then((r) => r[0]?.n ?? 0)

  if (used > 0) {
    return NextResponse.json(
      { error: `Tag is used by ${used} post(s). Remove it from posts first.` },
      { status: 409 }
    )
  }

  const deleted = await db.delete(tags).where(eq(tags.id, id)).returning({ id: tags.id })
  if (!deleted.length) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ ok: true })
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
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

  const nameRaw = body?.name != null ? String(body.name).trim() : null
  const slugRaw = body?.slug != null ? String(body.slug).trim() : null

  if (nameRaw !== null && (!nameRaw || nameRaw.length > 48)) {
    return NextResponse.json({ error: "Invalid name (1..48 chars)" }, { status: 400 })
  }

  const nextSlug =
    slugRaw === null ? null : slugify(slugRaw || (nameRaw ?? ""))

  if (nextSlug !== null && (!nextSlug || nextSlug.length > 64)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 })
  }

  // must update at least one field
  if (nameRaw === null && nextSlug === null) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  // ensure tag exists
  const existing = await db.select({ id: tags.id }).from(tags).where(eq(tags.id, id)).limit(1)
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // slug uniqueness (unique index)
  if (nextSlug !== null) {
    const dup = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, nextSlug))
      .limit(1)

    if (dup.length && dup[0].id !== id) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
    }
  }

  const updated = await db
    .update(tags)
    .set({
      ...(nameRaw !== null ? { name: nameRaw } : {}),
      ...(nextSlug !== null ? { slug: nextSlug } : {}),
    })
    .where(eq(tags.id, id))
    .returning({ id: tags.id, name: tags.name, slug: tags.slug, createdAt: tags.createdAt })

  return NextResponse.json({ ok: true, tag: updated[0] })
}


