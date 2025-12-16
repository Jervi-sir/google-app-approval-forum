import { NextResponse } from "next/server"
import { z } from "zod"
import { and, desc, eq, sql } from "drizzle-orm"
import { UpdateCommentSchema, UuidSchema } from "@/app/api/_schema"
import { db } from "@/drizzle/db"
import { comments, posts, profiles } from "@/drizzle/schema"

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const postId = UuidSchema.parse(id)

    const url = new URL(req.url)
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"))
    const limitRaw = Number(url.searchParams.get("limit") ?? "10")
    const limit = Math.min(50, Math.max(1, limitRaw))
    const offset = (page - 1) * limit

    const post = await db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.isDeleted, false)),
      columns: { id: true, moderationStatus: true },
    })
    if (!post || post.moderationStatus === "hidden") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const items = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        author: {
          id: profiles.id,
          name: profiles.name,
          image: profiles.avatarUrl,
          isVerified: profiles.isVerified,
        },
      })
      .from(comments)
      .innerJoin(profiles, eq(profiles.id, comments.authorId))
      .where(and(eq(comments.postId, postId), eq(comments.isDeleted, false)))
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset)

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)`.mapWith(Number) })
      .from(comments)
      .where(and(eq(comments.postId, postId), eq(comments.isDeleted, false)))

    const hasMore = offset + items.length < total

    return NextResponse.json({ items, page, limit, total, hasMore })
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid params", details: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}
