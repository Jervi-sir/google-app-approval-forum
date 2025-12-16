import { NextResponse } from "next/server"
import { z } from "zod"
import { and, desc, eq, sql } from "drizzle-orm"
import { UpdateCommentSchema, UuidSchema } from "@/app/api/_schema"
import { db } from "@/drizzle/db"
import { comments, posts, profiles } from "@/drizzle/schema"


const DeleteSchema = z.object({
  authorId: UuidSchema,
})

export async function PATCH(req: Request, ctx: { params: Promise<{ commentId: string }> }) {
  try {
    const { commentId } = await ctx.params
    const commentIdLocal = UuidSchema.parse(commentId)

    const body = await req.json()
    const input = UpdateCommentSchema.parse(body)

    const existing = await db.query.comments.findFirst({
      where: eq(comments.id, commentIdLocal),
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
      .where(and(eq(comments.id, commentIdLocal), eq(comments.authorId, input.authorId)))
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

export async function DELETE(req: Request, ctx: { params: Promise<{ commentId: string }> }) {
  try {
    const { commentId } = await ctx.params
    const commentIdLocal = UuidSchema.parse(commentId)

    const body = await req.json().catch(() => ({}))
    const input = DeleteSchema.parse(body)

    const existing = await db.query.comments.findFirst({
      where: eq(comments.id, commentIdLocal),
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
      .where(and(eq(comments.id, commentIdLocal), eq(comments.authorId, input.authorId)))

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid payload", details: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}
