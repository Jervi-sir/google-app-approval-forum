import { NextResponse } from "next/server"
import { desc, eq, inArray, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { comments, postLikes, postSaves, postTags, posts, profiles, tags } from "@/drizzle/schema"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  const supabase = createClient(await cookies())
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = auth.user.id

  const saved = await db
    .select({ postId: postSaves.postId, createdAt: postSaves.createdAt })
    .from(postSaves)
    .where(eq(postSaves.userId, userId))
    .orderBy(desc(postSaves.createdAt))
    .limit(50)

  const ids = saved.map((s) => s.postId)
  if (!ids.length) return NextResponse.json({ items: [] })

  const likesCount = sql<number>`(select count(*)::int from ${postLikes} pl where pl.post_id = ${posts.id})`
  const savesCount = sql<number>`(select count(*)::int from ${postSaves} ps where ps.post_id = ${posts.id})`
  const commentsCount = sql<number>`(
    select count(*)::int from ${comments} c
    where c.post_id = ${posts.id} and c.is_deleted = false
  )`

  const tagsAgg = sql<string[]>`
    coalesce(
      array_agg(distinct ${tags.name}) filter (where ${tags.name} is not null),
      '{}'
    )
  `

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      playStoreUrl: posts.playStoreUrl,
      googleGroupUrl: posts.googleGroupUrl,
      createdAt: posts.createdAt,
      moderationStatus: posts.moderationStatus,

      authorId: profiles.id,
      authorName: profiles.name,
      authorAvatar: profiles.avatarUrl,
      authorIsVerified: profiles.isVerified,

      likes: likesCount,
      saves: savesCount,
      comments: commentsCount,

      tags: tagsAgg,
    })
    .from(posts)
    .innerJoin(profiles, eq(profiles.id, posts.authorId))
    .leftJoin(postTags, eq(postTags.postId, posts.id))
    .leftJoin(tags, eq(tags.id, postTags.tagId))
    .where(inArray(posts.id, ids))
    .groupBy(posts.id, profiles.id)

  const byId = new Map(
    rows.map((p) => [
      p.id,
      {
        id: p.id,
        title: p.title,
        content: p.content,
        playStoreUrl: p.playStoreUrl ?? "",
        googleGroupUrl: p.googleGroupUrl ?? "",
        createdAt: p.createdAt?.toISOString?.() ?? String(p.createdAt),
        tags: p.tags ?? [],
        moderationStatus: p.moderationStatus as any,
        author: {
          id: p.authorId,
          name: p.authorName ?? "Unknown",
          image: p.authorAvatar ?? undefined,
          isVerified: !!p.authorIsVerified,
        },
        counts: {
          likes: Number(p.likes ?? 0),
          comments: Number(p.comments ?? 0),
          saves: Number(p.saves ?? 0),
        },
      },
    ]),
  )

  return NextResponse.json({
    items: saved.map((s) => ({
      postId: s.postId,
      savedAt: s.createdAt,
      post: byId.get(s.postId) ?? null,
    })),
  })
}
