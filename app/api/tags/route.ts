import { NextResponse } from "next/server"
import { tags } from "@/drizzle/schema"
import { asc, ilike } from "drizzle-orm"
import { db } from "@/drizzle/db"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = (url.searchParams.get("q") || "").trim()
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200)

    const rows = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        createdAt: tags.createdAt,
      })
      .from(tags)
      .where(q ? ilike(tags.name, `%${q}%`) : undefined)
      .orderBy(asc(tags.name))
      .limit(limit)

    return NextResponse.json({ ok: true, tags: rows })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}
