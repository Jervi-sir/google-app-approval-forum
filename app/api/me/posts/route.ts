// app/api/me/posts/route.ts
import { NextResponse } from "next/server"
import { desc, eq, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { posts, postLikes, postSaves, comments, postTags, tags, profiles } from "@/drizzle/schema"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  const supabase = createClient(await cookies())
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = auth.user.id

  // counts subqueries (same idea as /api/posts)
  const likesCount = sql<number>`(
    select count(*)::int from ${postLikes} pl where pl.post_id = ${posts.id}
  )`
  const savesCount = sql<number>`(
    select count(*)::int from ${postSaves} ps where ps.post_id = ${posts.id}
  )`
  const commentsCount = sql<number>`(
    select count(*)::int from ${comments} c
    where c.post_id = ${posts.id} and c.is_deleted = false
  )`

  // tags aggregation (works with left joins + groupBy)
  const tagsAgg = sql<string[]>`
    coalesce(
      array_agg(distinct ${tags.name})
        filter (where ${tags.name} is not null),
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

      // ✅ author fields (needed for PostCard)
      authorId: profiles.id,
      authorName: profiles.name,
      authorAvatar: profiles.avatarUrl,
      authorIsVerified: profiles.isVerified,

      // ✅ counts
      likes: likesCount,
      saves: savesCount,
      comments: commentsCount,

      // ✅ tags
      tags: tagsAgg,
    })
    .from(posts)
    .innerJoin(profiles, eq(profiles.id, posts.authorId)) // ✅ important
    .leftJoin(postTags, eq(postTags.postId, posts.id))
    .leftJoin(tags, eq(tags.id, postTags.tagId))
    .where(eq(posts.authorId, userId))
    .groupBy(posts.id, profiles.id) // ✅ must include profiles.id
    .orderBy(desc(posts.createdAt))
    .limit(30)

  const data = rows.map((p) => ({
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
  }))

  // ✅ same “shape” idea as /api/posts (you can keep items if you want, but PostCard cares about post shape)
  return NextResponse.json({ ok: true, items: data })
}
