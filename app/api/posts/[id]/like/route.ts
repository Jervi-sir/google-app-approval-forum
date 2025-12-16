import { NextResponse } from "next/server"
import { and, eq, sql } from "drizzle-orm"
import { ToggleActionSchema, UuidSchema } from "@/app/api/_schema"
import { postLikes, posts } from "@/drizzle/schema"
import { db } from "@/drizzle/db"

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const postId = UuidSchema.parse(id)

    const body = await req.json()
    const input = ToggleActionSchema.parse(body)

    const post = await db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.isDeleted, false)),
      columns: { id: true, moderationStatus: true },
    })
    if (!post || post.moderationStatus === "hidden") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const existing = await db.query.postLikes.findFirst({
      where: and(eq(postLikes.postId, postId), eq(postLikes.userId, input.userId)),
      columns: { postId: true },
    })

    let liked = false
    if (existing) {
      await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, input.userId)))
      liked = false
    } else {
      await db.insert(postLikes).values({ postId, userId: input.userId })
      liked = true
    }

    const [{ likesCount }] = await db
      .select({ likesCount: sql<number>`count(*)`.mapWith(Number) })
      .from(postLikes)
      .where(eq(postLikes.postId, postId))

    return NextResponse.json({ liked, likesCount })
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid payload", details: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}
