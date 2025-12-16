import { NextResponse } from "next/server"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { posts, postLikes, postSaves, comments, postTags, tags } from "@/drizzle/schema"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  const supabase = createClient(await cookies())
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = auth.user.id

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
    .where(eq(posts.authorId, userId))
    .groupBy(posts.id)
    .orderBy(desc(posts.createdAt))
    .limit(30)

  const ids = rows.map((r) => r.id)

  const tagRows = ids.length
    ? await db
      .select({ postId: postTags.postId, tag: tags.name })
      .from(postTags)
      .innerJoin(tags, eq(tags.id, postTags.tagId))
      .where(inArray(postTags.postId, ids))
    : []

  const tagsByPost = new Map<string, string[]>()
  for (const tr of tagRows) {
    const arr = tagsByPost.get(tr.postId) ?? []
    arr.push(tr.tag)
    tagsByPost.set(tr.postId, arr)
  }

  return NextResponse.json({
    items: rows.map((p) => ({
      id: p.id,
      title: p.title,
      excerpt: (p.content ?? "").replace(/\s+/g, " ").trim().slice(0, 220) + ((p.content ?? "").length > 220 ? "…" : ""),
      createdAt: p.createdAt,
      tags: tagsByPost.get(p.id) ?? [],
      moderationStatus: p.moderationStatus,
      counts: { likes: p.likes, comments: p.commentsCount, saves: p.saves },
    })),
  })
}
