import { NextResponse } from "next/server"
import { z } from "zod"
import { and, desc, eq, inArray, sql, ilike, or } from "drizzle-orm"

import { db } from "@/drizzle/db"
import { postSaves, posts, profiles, postTags, tags, postLikes, comments as commentsTable } from "@/drizzle/schema"

const QuerySchema = z.object({
  userId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  q: z.string().optional(),
})

function excerpt(text: string, max = 160) {
  const t = (text ?? "").trim().replace(/\s+/g, " ")
  if (t.length <= max) return t
  return t.slice(0, max).trim() + "…"
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parsed = QuerySchema.safeParse({
      userId: url.searchParams.get("userId"),
      page: url.searchParams.get("page") ?? "1",
      limit: url.searchParams.get("limit") ?? "10",
      q: url.searchParams.get("q") ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid params", details: parsed.error }, { status: 400 })
    }

    const { userId, page, limit, q } = parsed.data
    const offset = (page - 1) * limit
    const qTrim = q?.trim()
    const qLike = qTrim ? `%${qTrim}%` : null

    // Where for posts filtering (optional search)
    const postFilter = and(
      eq(posts.isDeleted, false),
      qLike ? or(ilike(posts.title, qLike), ilike(posts.content, qLike)) : undefined
    )

    // Total count of saved posts (respecting search filter)
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)`.mapWith(Number) })
      .from(postSaves)
      .innerJoin(posts, eq(posts.id, postSaves.postId))
      .where(and(eq(postSaves.userId, userId), postFilter))

    if (!total) {
      return NextResponse.json({
        items: [],
        page,
        limit,
        total: 0,
        hasMore: false,
      })
    }

    // Get the saved posts page (ordered by save time)
    const savedRows = await db
      .select({
        savedAt: postSaves.createdAt,
        post: {
          id: posts.id,
          title: posts.title,
          content: posts.content,
          createdAt: posts.createdAt,
        },
        author: {
          id: profiles.id,
          name: profiles.name,
          isVerified: profiles.isVerified,
        },
      })
      .from(postSaves)
      .innerJoin(posts, eq(posts.id, postSaves.postId))
      .innerJoin(profiles, eq(profiles.id, posts.authorId))
      .where(and(eq(postSaves.userId, userId), postFilter))
      .orderBy(desc(postSaves.createdAt))
      .limit(limit)
      .offset(offset)

    const postIds = savedRows.map((r) => r.post.id)
    if (postIds.length === 0) {
      return NextResponse.json({ items: [], page, limit, total, hasMore: false })
    }

    // Tags for all posts in this page
    const tagRows = await db
      .select({
        postId: postTags.postId,
        tagName: tags.name,
      })
      .from(postTags)
      .innerJoin(tags, eq(tags.id, postTags.tagId))
      .where(inArray(postTags.postId, postIds))

    const tagsByPost = new Map<string, string[]>()
    for (const tr of tagRows) {
      const arr = tagsByPost.get(tr.postId) ?? []
      arr.push(tr.tagName)
      tagsByPost.set(tr.postId, arr)
    }

    // Counts (likes, saves, comments) for this page
    const likesCounts = await db
      .select({
        postId: postLikes.postId,
        c: sql<number>`count(*)`.mapWith(Number),
      })
      .from(postLikes)
      .where(inArray(postLikes.postId, postIds))
      .groupBy(postLikes.postId)

    const savesCounts = await db
      .select({
        postId: postSaves.postId,
        c: sql<number>`count(*)`.mapWith(Number),
      })
      .from(postSaves)
      .where(inArray(postSaves.postId, postIds))
      .groupBy(postSaves.postId)

    const commentsCounts = await db
      .select({
        postId: commentsTable.postId,
        c: sql<number>`count(*)`.mapWith(Number),
      })
      .from(commentsTable)
      .where(and(inArray(commentsTable.postId, postIds), eq(commentsTable.isDeleted, false)))
      .groupBy(commentsTable.postId)

    const likesMap = new Map(likesCounts.map((r) => [r.postId, r.c]))
    const savesMap = new Map(savesCounts.map((r) => [r.postId, r.c]))
    const commentsMap = new Map(commentsCounts.map((r) => [r.postId, r.c]))

    const items = savedRows.map((r) => {
      const postId = r.post.id
      return {
        id: postId,
        title: r.post.title,
        excerpt: excerpt(r.post.content, 170),
        tags: tagsByPost.get(postId) ?? [],
        createdAt: r.post.createdAt,
        savedAt: r.savedAt,
        author: r.author,
        counts: {
          likes: likesMap.get(postId) ?? 0,
          comments: commentsMap.get(postId) ?? 0,
          saves: savesMap.get(postId) ?? 0,
        },
      }
    })

    const hasMore = offset + items.length < total

    return NextResponse.json({ items, page, limit, total, hasMore })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}
