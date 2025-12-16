import { NextResponse } from "next/server"
import { z } from "zod"
import { posts, tags, postTags, postImages, profiles, postLikes, postSaves, comments } from "@/drizzle/schema"
import { slugifyTag } from "@/lib/slug"
import { and, eq, inArray, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { UuidSchema } from "../../_schema"

const UpdatePostSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  content: z.string().min(1).optional(),
  playStoreUrl: z.string().url().optional().or(z.literal("")).transform(v => v || undefined),
  googleGroupUrl: z.string().url().optional().or(z.literal("")).transform(v => v || undefined),
  tags: z.array(z.string().min(1)).max(8).optional(),
  images: z.array(z.string().url()).max(2).optional(),

  // MVP auth check: require authorId to verify ownership.
  // In a real setup, read user id from Supabase session instead.
  authorId: z.string().uuid(),
})

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const postId = z.string().uuid().parse(id)

    const body = await req.json()
    const input = UpdatePostSchema.parse(body)

    // Ownership check
    const existing = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      columns: { id: true, authorId: true },
    })
    if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 })
    if (existing.authorId !== input.authorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const normalizedTags = input.tags
      ? Array.from(
        new Map(
          input.tags.map((name) => {
            const slug = slugifyTag(name)
            return [slug, { name: name.trim().slice(0, 48), slug }]
          })
        ).values()
      )
      : null

    await db.transaction(async (tx) => {
      // 1) update base post fields
      const patch: any = {}
      if (input.title !== undefined) patch.title = input.title
      if (input.content !== undefined) patch.content = input.content
      if (body.playStoreUrl !== undefined) patch.playStoreUrl = input.playStoreUrl
      if (body.googleGroupUrl !== undefined) patch.googleGroupUrl = input.googleGroupUrl

      if (Object.keys(patch).length) {
        patch.updatedAt = new Date()
        await tx.update(posts).set(patch).where(eq(posts.id, postId))
      }

      // 2) replace tags if provided
      if (normalizedTags) {
        await tx.delete(postTags).where(eq(postTags.postId, postId))

        if (normalizedTags.length) {
          const existingTags = await tx
            .select({ id: tags.id, slug: tags.slug })
            .from(tags)
            .where(inArray(tags.slug, normalizedTags.map((t) => t.slug)))

          const existingSlugs = new Set(existingTags.map((t) => t.slug))
          const toInsert = normalizedTags.filter((t) => !existingSlugs.has(t.slug))
          if (toInsert.length) {
            await tx.insert(tags).values(toInsert.map((t) => ({ name: t.name, slug: t.slug })))
          }

          const all = await tx
            .select({ id: tags.id, slug: tags.slug })
            .from(tags)
            .where(inArray(tags.slug, normalizedTags.map((t) => t.slug)))

          await tx.insert(postTags).values(
            all.map((t) => ({
              postId,
              tagId: t.id,
            }))
          )
        }
      }

      // 3) replace images if provided
      if (input.images) {
        await tx.delete(postImages).where(eq(postImages.postId, postId))
        if (input.images.length) {
          await tx.insert(postImages).values(
            input.images.map((url, idx) => ({
              postId,
              url,
              position: idx,
            }))
          )
        }
      }
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid payload", details: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}


export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const postId = UuidSchema.parse(id)

    const url = new URL(req.url)
    const viewerId = url.searchParams.get("viewerId")
    const parsedViewerId = viewerId ? UuidSchema.parse(viewerId) : null

    // base post + author
    const row = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        playStoreUrl: posts.playStoreUrl,
        googleGroupUrl: posts.googleGroupUrl,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        moderationStatus: posts.moderationStatus,
        author: {
          id: profiles.id,
          name: profiles.name,
          image: profiles.avatarUrl,
          isVerified: profiles.isVerified,
        },
        // Counts as subqueries
        likes: sql<number>`(select count(*) from ${postLikes} pl where pl.post_id = ${posts.id})`.mapWith(Number),
        saves: sql<number>`(select count(*) from ${postSaves} ps where ps.post_id = ${posts.id})`.mapWith(Number),
        comments: sql<number>`(select count(*) from ${comments} c where c.post_id = ${posts.id} and c.is_deleted = false)`.mapWith(Number),
      })
      .from(posts)
      .innerJoin(profiles, eq(profiles.id, posts.authorId))
      .where(and(eq(posts.id, postId), eq(posts.isDeleted, false)))
      .limit(1)

    if (!row[0]) return NextResponse.json({ error: "Post not found" }, { status: 404 })
    if (row[0].moderationStatus === "hidden") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // tags
    const tagRows = await db
      .select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(postTags)
      .innerJoin(tags, eq(tags.id, postTags.tagId))
      .where(eq(postTags.postId, postId))

    // images
    const imageRows = await db
      .select({ id: postImages.id, url: postImages.url, position: postImages.position })
      .from(postImages)
      .where(eq(postImages.postId, postId))
      .orderBy(postImages.position)

    // viewer flags
    let likedByMe = false
    let savedByMe = false
    if (parsedViewerId) {
      const like = await db.query.postLikes.findFirst({
        where: and(eq(postLikes.postId, postId), eq(postLikes.userId, parsedViewerId)),
        columns: { postId: true },
      })
      const save = await db.query.postSaves.findFirst({
        where: and(eq(postSaves.postId, postId), eq(postSaves.userId, parsedViewerId)),
        columns: { postId: true },
      })
      likedByMe = !!like
      savedByMe = !!save
    }

    const { likes, saves, comments: commentsCount, ...rest } = row[0]

    return NextResponse.json({
      post: {
        ...rest,
        tags: tagRows,
        images: imageRows,
        counts: { likes, saves, comments: commentsCount },
        viewer: { likedByMe, savedByMe },
      },
    })
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid params", details: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}
