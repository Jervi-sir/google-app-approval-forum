import { NextResponse } from "next/server"
import { and, eq, sql } from "drizzle-orm"
import { ToggleActionSchema, UuidSchema } from "@/app/api/_schema"
import { db } from "@/drizzle/db"
import { posts, postSaves } from "@/drizzle/schema"

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

    const existing = await db.query.postSaves.findFirst({
      where: and(eq(postSaves.postId, postId), eq(postSaves.userId, input.userId)),
      columns: { postId: true },
    })

    let saved = false
    if (existing) {
      await db.delete(postSaves).where(and(eq(postSaves.postId, postId), eq(postSaves.userId, input.userId)))
      saved = false
    } else {
      await db.insert(postSaves).values({ postId, userId: input.userId })
      saved = true
    }

    const [{ savesCount }] = await db
      .select({ savesCount: sql<number>`count(*)`.mapWith(Number) })
      .from(postSaves)
      .where(eq(postSaves.postId, postId))

    return NextResponse.json({ saved, savesCount })
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid payload", details: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}
