import { NextResponse } from "next/server"
import { and, eq, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { profiles, posts, postLikes, postSaves } from "@/drizzle/schema"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const u = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      image: profiles.avatarUrl,
      isVerified: profiles.isVerified,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1)
    .then((r) => r[0])

  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const stats = await db
    .select({
      posts: sql<number>`coalesce(count(distinct ${posts.id}), 0)`.mapWith(Number),
      likes: sql<number>`coalesce(count(distinct ${postLikes.userId}), 0)`.mapWith(Number),
      saves: sql<number>`coalesce(count(distinct ${postSaves.userId}), 0)`.mapWith(Number),
    })
    .from(posts)
    .leftJoin(postLikes, eq(postLikes.postId, posts.id))
    .leftJoin(postSaves, eq(postSaves.postId, posts.id))
    .where(
      and(
        eq(posts.authorId, id),
        eq(posts.isDeleted, false),
        sql`${posts.moderationStatus} <> 'hidden'`
      )
    )
    .limit(1)
    .then((r) => r[0] ?? { posts: 0, likes: 0, saves: 0 })

  return NextResponse.json({
    id: u.id,
    name: u.name ?? "Unknown",
    image: u.image,
    isVerified: u.isVerified,
    joinedAt: u.createdAt,
    stats,
  })
}
