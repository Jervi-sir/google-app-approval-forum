import { NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { posts, profiles, postTags, tags, comments, postLikes, postSaves, reports } from "@/drizzle/schema"

// OPTIONAL auth gate
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  // ---- admin/mod gate ----
  const supabase = createClient(await cookies())
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const me = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, auth.user.id))
    .limit(1)

  const role = me[0]?.role
  if (role !== "admin" && role !== "moderator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  // ------------------------

  // post + author
  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      playStoreUrl: posts.playStoreUrl,
      googleGroupUrl: posts.googleGroupUrl,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      moderationStatus: posts.moderationStatus,
      isDeleted: posts.isDeleted,
      authorId: posts.authorId,
      authorName: profiles.name,
      authorVerified: profiles.isVerified,
      reportsCount: sql<number>`coalesce(count(distinct ${reports.id}), 0)`.mapWith(Number),
      likesCount: sql<number>`coalesce(count(distinct ${postLikes.userId}), 0)`.mapWith(Number),
      savesCount: sql<number>`coalesce(count(distinct ${postSaves.userId}), 0)`.mapWith(Number),
      commentsCount: sql<number>`coalesce(count(distinct ${comments.id}), 0)`.mapWith(Number),
    })
    .from(posts)
    .leftJoin(profiles, eq(profiles.id, posts.authorId))
    .leftJoin(reports, eq(reports.postId, posts.id))
    .leftJoin(postLikes, eq(postLikes.postId, posts.id))
    .leftJoin(postSaves, eq(postSaves.postId, posts.id))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .where(eq(posts.id, id))
    .groupBy(posts.id, profiles.id)
    .limit(1)

  const p = rows[0]
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // tags
  const tagRows = await db
    .select({ tag: tags.name })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .where(eq(postTags.postId, id))

  return NextResponse.json({
    id: p.id,
    title: p.title,
    content: p.content,
    playStoreUrl: p.playStoreUrl,
    googleGroupUrl: p.googleGroupUrl,
    tags: tagRows.map((x) => x.tag),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    moderationStatus: p.moderationStatus,
    isDeleted: p.isDeleted,
    author: {
      id: p.authorId,
      name: p.authorName ?? "Unknown",
      isVerified: !!p.authorVerified,
    },
    counts: {
      reports: p.reportsCount,
      likes: p.likesCount,
      saves: p.savesCount,
      comments: p.commentsCount,
    },
  })
}
