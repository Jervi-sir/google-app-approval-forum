import { NextResponse } from "next/server"
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"
import { posts, profiles, postTags, tags, comments, postLikes, reports } from "@/drizzle/schema"

// OPTIONAL: auth gate (recommended)
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { db } from "@/drizzle/db"

function num(v: string | null, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export async function GET(req: Request) {
  // ---- Optional admin/mod gate ----
  const supabase = createClient(await cookies())
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // you store role on profiles table
  const me = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, auth.user.id))
    .limit(1)

  const role = me[0]?.role
  if (role !== "admin" && role !== "moderator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  // --------------------------------

  const { searchParams } = new URL(req.url)
  const page = num(searchParams.get("page"), 1)
  const limit = Math.min(num(searchParams.get("limit"), 20), 50)
  const q = (searchParams.get("q") ?? "").trim()
  const status = (searchParams.get("status") ?? "all") as
    | "all"
    | "ok"
    | "needs_fix"
    | "hidden"
    | "deleted"

  const whereParts = []

  // status scope
  if (status === "deleted") whereParts.push(eq(posts.isDeleted, true))
  else {
    whereParts.push(eq(posts.isDeleted, false))
    if (status !== "all") whereParts.push(eq(posts.moderationStatus, status))
  }

  // search (title, post id, author id, author name)
  if (q) {
    whereParts.push(
      or(
        ilike(posts.title, `%${q}%`),
        ilike(posts.id, `%${q}%`),
        ilike(posts.authorId, `%${q}%`),
        ilike(profiles.name, `%${q}%`)
      )
    )
  }

  const where = whereParts.length ? and(...whereParts) : undefined
  const offset = (page - 1) * limit

  // total count
  const totalRes = await db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(posts)
    .leftJoin(profiles, eq(profiles.id, posts.authorId))
    .where(where)

  const total = totalRes[0]?.total ?? 0

  // main rows
  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      createdAt: posts.createdAt,
      moderationStatus: posts.moderationStatus,
      isDeleted: posts.isDeleted,
      authorId: posts.authorId,
      authorName: profiles.name,
      authorVerified: profiles.isVerified,
      reportsCount: sql<number>`coalesce(count(distinct ${reports.id}), 0)`.mapWith(Number),
      likesCount: sql<number>`coalesce(count(distinct ${postLikes.userId}), 0)`.mapWith(Number),
      commentsCount: sql<number>`coalesce(count(distinct ${comments.id}), 0)`.mapWith(Number),
    })
    .from(posts)
    .leftJoin(profiles, eq(profiles.id, posts.authorId))
    .leftJoin(reports, eq(reports.postId, posts.id))
    .leftJoin(postLikes, eq(postLikes.postId, posts.id))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .where(where)
    .groupBy(posts.id, profiles.id)
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset)

  // tags for returned post ids
  const ids = rows.map((r) => r.id)
  let tagsMap: Record<string, string[]> = {}
  if (ids.length) {
    const tagRows = await db
      .select({ postId: postTags.postId, tag: tags.name })
      .from(postTags)
      .innerJoin(tags, eq(tags.id, postTags.tagId))
      .where(inArray(postTags.postId, ids))

    tagsMap = tagRows.reduce<Record<string, string[]>>((acc, r) => {
      ; (acc[r.postId] ??= []).push(r.tag)
      return acc
    }, {})
  }

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    createdAt: r.createdAt.toISOString(),
    moderationStatus: r.moderationStatus,
    isDeleted: r.isDeleted,
    author: {
      id: r.authorId,
      name: r.authorName ?? "Unknown",
      isVerified: !!r.authorVerified,
    },
    tags: tagsMap[r.id] ?? [],
    reportsCount: r.reportsCount,
    likesCount: r.likesCount,
    commentsCount: r.commentsCount,
  }))

  return NextResponse.json({
    items,
    page,
    limit,
    total,
    hasMore: page * limit < total,
  })
}
