import { NextResponse } from "next/server"
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { posts, postLikes, postSaves, comments, postTags, tags } from "@/drizzle/schema"

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: userId } = await ctx.params
  if (!userId) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1)
  const limitRaw = Number(searchParams.get("limit") ?? "10") || 10
  const limit = Math.min(30, Math.max(1, limitRaw))
  const q = (searchParams.get("q") ?? "").trim()

  const whereClause = and(
    eq(posts.authorId, userId),
    eq(posts.isDeleted, false),
    sql`${posts.moderationStatus} <> 'hidden'`,
    q ? ilike(posts.title, `%${q}%`) : undefined
  )

  const total = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(posts)
    .where(whereClause)
    .then((r) => r[0]?.n ?? 0)

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      moderationStatus: posts.moderationStatus,
      createdAt: posts.createdAt,
      likes: sql<number>`coalesce(count(distinct ${postLikes.userId}), 0)`.mapWith(Number),
      saves: sql<number>`coalesce(count(distinct ${postSaves.userId}), 0)`.mapWith(Number),
      commentsCount: sql<number>`coalesce(count(distinct ${comments.id}), 0)`.mapWith(Number),
    })
    .from(posts)
    .leftJoin(postLikes, eq(postLikes.postId, posts.id))
    .leftJoin(postSaves, eq(postSaves.postId, posts.id))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .where(whereClause)
    .groupBy(posts.id)
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  const postIds = rows.map((r) => r.id)

  const tagRows = postIds.length
    ? await db
      .select({ postId: postTags.postId, tag: tags.name })
      .from(postTags)
      .innerJoin(tags, eq(tags.id, postTags.tagId))
      .where(inArray(postTags.postId, postIds))
    : []

  const tagsByPost = new Map<string, string[]>()
  for (const tr of tagRows) {
    const arr = tagsByPost.get(tr.postId) ?? []
    arr.push(tr.tag)
    tagsByPost.set(tr.postId, arr)
  }

  const items = rows.map((p) => ({
    id: p.id,
    title: p.title,
    excerpt:
      (p.content ?? "").replace(/\s+/g, " ").trim().slice(0, 240) +
      ((p.content ?? "").length > 240 ? "…" : ""),
    createdAt: p.createdAt,
    tags: tagsByPost.get(p.id) ?? [],
    moderationStatus: p.moderationStatus,
    counts: { likes: p.likes, comments: p.commentsCount, saves: p.saves },
  }))

  return NextResponse.json({
    items,
    page,
    limit,
    total,
    hasMore: page * limit < total,
  })
}
