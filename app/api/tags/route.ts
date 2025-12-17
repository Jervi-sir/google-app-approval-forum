import { NextResponse } from "next/server"
import { tags } from "@/drizzle/schema"
import { and, asc, eq, ilike } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { z } from "zod"
import { slugifyTag } from "@/lib/slug"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = (url.searchParams.get("q") || "").trim()
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200)

    const activeParam = (url.searchParams.get("active") || "").toLowerCase()
    const activeFilter =
      activeParam === "all"
        ? null
        : activeParam === "0" || activeParam === "false"
          ? false
          : true // default

    const whereParts = []

    if (activeFilter !== null) {
      whereParts.push(eq(tags.isActive, activeFilter))
    }

    if (q) {
      whereParts.push(ilike(tags.name, `%${q}%`))
    }

    const whereClause = whereParts.length ? and(...whereParts) : undefined

    const rows = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        isActive: tags.isActive,
        createdAt: tags.createdAt,
      })
      .from(tags)
      .where(whereClause)
      .orderBy(asc(tags.name))
      .limit(limit)

    return NextResponse.json({ ok: true, tags: rows })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}

const CreateTagSchema = z.object({
  name: z.string().min(1).max(48),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const input = CreateTagSchema.parse(body)

    const name = input.name.trim().slice(0, 48)
    const slug = slugifyTag(name)

    // if exists by slug -> return existing
    const existing = await db.query.tags.findFirst({
      where: eq(tags.slug, slug),
      columns: { id: true, name: true, slug: true },
    })

    if (existing) {
      return NextResponse.json({ ok: true, tag: existing })
    }

    // insert new tag
    const inserted = await db
      .insert(tags)
      .values({ name, slug })
      .returning({ id: tags.id, name: tags.name, slug: tags.slug })

    return NextResponse.json({ ok: true, tag: inserted[0] })
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid payload", details: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}
