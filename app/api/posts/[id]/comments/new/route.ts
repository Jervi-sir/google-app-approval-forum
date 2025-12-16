import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { CreateCommentSchema, UuidSchema } from "@/app/api/_schema"
import { db } from "@/drizzle/db"
import { comments, posts } from "@/drizzle/schema"

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const postId = UuidSchema.parse(id)

    const body = await req.json()
    const input = CreateCommentSchema.parse(body)

    const post = await db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.isDeleted, false)),
      columns: { id: true, moderationStatus: true },
    })
    if (!post || post.moderationStatus === "hidden") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const [created] = await db
      .insert(comments)
      .values({
        postId,
        authorId: input.authorId,
        content: input.content,
      })
      .returning({
        id: comments.id,
        postId: comments.postId,
        authorId: comments.authorId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
      })

    return NextResponse.json({ comment: created })
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid payload", details: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}
