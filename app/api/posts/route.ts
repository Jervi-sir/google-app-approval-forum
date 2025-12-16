import { NextResponse } from "next/server"
import { z } from "zod"

import { posts, tags, postTags, postImages, profiles, postLikes, postSaves, comments } from "@/drizzle/schema"
import { slugifyTag } from "@/lib/slug"
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"

const CreatePostSchema = z.object({
  title: z.string().min(1).max(160),
  content: z.string().min(1),
  playStoreUrl: z.string().url().optional().or(z.literal("")).transform(v => v || undefined),
  googleGroupUrl: z.string().url().optional().or(z.literal("")).transform(v => v || undefined),
  tags: z.array(z.string().min(1)).max(8).default([]),
  images: z.array(z.string().url()).max(2).default([]),

  // If you’re using Supabase Auth, you should NOT accept authorId from client.
  // For now (MVP), allow passing authorId explicitly:
  authorId: z.string().uuid(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const input = CreatePostSchema.parse(body)

    // (Optional) ensure author exists in profiles
    const author = await db.query.profiles.findFirst({
      where: eq(profiles.id, input.authorId),
      columns: { id: true },
    })
    if (!author) {
      return NextResponse.json({ error: "Author profile not found" }, { status: 400 })
    }

    const normalizedTags = Array.from(
      new Map(
        input.tags.map((name) => {
          const slug = slugifyTag(name)
          return [slug, { name: name.trim().slice(0, 48), slug }]
        })
      ).values()
    )

    const created = await db.transaction(async (tx) => {
      // 1) create post
      const [createdPost] = await tx
        .insert(posts)
        .values({
          authorId: input.authorId,
          title: input.title,
          content: input.content,
          playStoreUrl: input.playStoreUrl,
          googleGroupUrl: input.googleGroupUrl,
        })
        .returning({ id: posts.id })

      const postId = createdPost.id

      // 2) upsert tags by slug (insert-if-missing)
      if (normalizedTags.length) {
        // check which already exist
        const existing = await tx
          .select({ id: tags.id, slug: tags.slug })
          .from(tags)
          .where(inArray(tags.slug, normalizedTags.map((t) => t.slug)))

        const existingSlugs = new Set(existing.map((e) => e.slug))
        const toInsert = normalizedTags.filter((t) => !existingSlugs.has(t.slug))

        if (toInsert.length) {
          await tx.insert(tags).values(
            toInsert.map((t) => ({
              name: t.name,
              slug: t.slug,
            }))
          )
        }

        // fetch tag ids (now all exist)
        const all = await tx
          .select({ id: tags.id, slug: tags.slug })
          .from(tags)
          .where(inArray(tags.slug, normalizedTags.map((t) => t.slug)))

        // 3) insert post_tags
        await tx.insert(postTags).values(
          all.map((t) => ({
            postId,
            tagId: t.id,
          }))
        )
      }

      // 4) insert images
      if (input.images.length) {
        await tx.insert(postImages).values(
          input.images.map((url, idx) => ({
            postId,
            url,
            position: idx,
          }))
        )
      }

      return { id: postId }
    })

    return NextResponse.json({ ok: true, postId: created.id }, { status: 201 })
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid payload", details: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}



export async function GET(req: Request) {
  const PAGE_SIZE = 10
  try {
    const host = req.headers.get("host") ?? "localhost:3000"
    const proto = req.headers.get("x-forwarded-proto") ?? "http"
    const url = new URL(req.url, `${proto}://${host}`)

    const page = Math.max(1, Number(url.searchParams.get("page") || "1"))
    const q = (url.searchParams.get("q") || "").trim()
    const tag = (url.searchParams.get("tag") || "").trim() // tag name or slug
    const verifiedOnly = url.searchParams.get("verified") === "1"
    const sort = (url.searchParams.get("sort") || "newest") as
      | "newest"
      | "most_liked"
      | "most_saved"
      | "most_commented"

    const offset = (page - 1) * PAGE_SIZE

    // --- WHERE ---
    const whereParts: any[] = [
      eq(posts.isDeleted, false),
      // hide "hidden" posts from public feed
      sql`${posts.moderationStatus} != 'hidden'`,
    ]

    if (q) {
      whereParts.push(
        sql`(${ilike(posts.title, `%${q}%`)} OR ${ilike(posts.content, `%${q}%`)})`
      )
    }

    if (verifiedOnly) {
      whereParts.push(eq(profiles.isVerified, true))
    }

    // If tag filter exists, filter by EXISTS on tag slug or name
    if (tag) {
      whereParts.push(sql`
        exists (
          select 1
          from ${postTags} pt
          join ${tags} t on t.id = pt.tag_id
          where pt.post_id = ${posts.id}
            and (t.slug = ${tag} or t.name = ${tag})
        )
      `)
    }

    const where = and(...whereParts)

    // --- COUNTS subqueries (fast & clean) ---
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

    // --- TAGS aggregation ---
    const tagsAgg = sql<string[]>`
      coalesce(
        array_agg(distinct ${tags.name})
          filter (where ${tags.name} is not null),
        '{}'
      )
    `

    // --- ORDER BY ---
    const orderBy =
      sort === "most_liked"
        ? [desc(likesCount), desc(posts.createdAt)]
        : sort === "most_saved"
          ? [desc(savesCount), desc(posts.createdAt)]
          : sort === "most_commented"
            ? [desc(commentsCount), desc(posts.createdAt)]
            : [desc(posts.createdAt)]

    // --- TOTAL COUNT (for pagination UI) ---
    const [{ total }] = await db
      .select({ total: sql<number>`count(distinct ${posts.id})::int` })
      .from(posts)
      .innerJoin(profiles, eq(profiles.id, posts.authorId))
      // join for tag aggregation filter compatibility (safe even if no tag)
      .leftJoin(postTags, eq(postTags.postId, posts.id))
      .leftJoin(tags, eq(tags.id, postTags.tagId))
      .where(where)

    // --- PAGE RESULTS ---
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
      .where(where)
      .groupBy(posts.id, profiles.id)
      .orderBy(...orderBy)
      .limit(PAGE_SIZE)
      .offset(offset)

    const pageCount = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE))

    const data = rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      playStoreUrl: r.playStoreUrl ?? "",
      googleGroupUrl: r.googleGroupUrl ?? "",
      createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
      tags: r.tags ?? [],
      moderationStatus: r.moderationStatus as any,
      author: {
        id: r.authorId,
        name: r.authorName ?? "Unknown",
        image: r.authorAvatar ?? undefined,
        isVerified: !!r.authorIsVerified,
      },
      counts: {
        likes: Number(r.likes ?? 0),
        comments: Number(r.comments ?? 0),
        saves: Number(r.saves ?? 0),
      },
    }))

    return NextResponse.json({
      ok: true,
      page,
      pageSize: PAGE_SIZE,
      total: total || 0,
      pageCount,
      posts: data,
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}
