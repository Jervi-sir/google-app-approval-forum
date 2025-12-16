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

const DeleteSchema = z.object({
  authorId: UuidSchema,
})

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const commentId = UuidSchema.parse(id)

    const body = await req.json()
    const input = UpdateCommentSchema.parse(body)

    const existing = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      columns: { id: true, authorId: true, isDeleted: true },
    })
    if (!existing || existing.isDeleted) return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    if (existing.authorId !== input.authorId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [updated] = await db
      .update(comments)
      .set({
        content: input.content,
        updatedAt: new Date(),
      })
      .where(and(eq(comments.id, commentId), eq(comments.authorId, input.authorId)))
      .returning({
        id: comments.id,
        content: comments.content,
        updatedAt: comments.updatedAt,
      })

    return NextResponse.json({ comment: updated })
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid payload", details: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const commentId = UuidSchema.parse(id)

    const body = await req.json().catch(() => ({}))
    const input = DeleteSchema.parse(body)

    const existing = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      columns: { id: true, authorId: true, isDeleted: true },
    })
    if (!existing || existing.isDeleted) return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    if (existing.authorId !== input.authorId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await db
      .update(comments)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: input.authorId,
        updatedAt: new Date(),
      })
      .where(and(eq(comments.id, commentId), eq(comments.authorId, input.authorId)))

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid payload", details: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}
