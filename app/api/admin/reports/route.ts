import { NextResponse } from "next/server"
import { and, desc, eq, ilike, or, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { reports, profiles } from "@/drizzle/schema"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = Number(v)
  if (!Number.isFinite(n)) return def
  return Math.max(min, Math.min(max, Math.floor(n)))
}

export async function GET(req: Request) {
  // ---- admin/mod gate ----
  const supabase = createClient(await cookies())
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const me = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, auth.user.id))
    .limit(1)

  const role = me[0]?.role
  if (role !== "admin" && role !== "moderator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  // ------------------------

  const url = new URL(req.url)
  const page = clampInt(url.searchParams.get("page"), 1, 1, 5000)
  const limit = clampInt(url.searchParams.get("limit"), 20, 1, 100)
  const q = (url.searchParams.get("q") ?? "").trim()
  const status = (url.searchParams.get("status") ?? "").trim()
  const reason = (url.searchParams.get("reason") ?? "").trim()

  const qWhere = q
    ? or(
      ilike(reports.id, `%${q}%`),
      ilike(profiles.name, `%${q}%`),
      // search by any possible target id
      ilike(sql`coalesce(${reports.postId}, ${reports.commentId}, ${reports.targetUserId})::text`, `%${q}%`)
    )
    : undefined

  const where = and(
    status ? eq(reports.status, status as any) : undefined,
    reason ? eq(reports.reason, reason as any) : undefined,
    qWhere
  )

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: reports.id,
        createdAt: reports.createdAt,
        status: reports.status,
        reason: reports.reason,
        targetType: reports.targetType,
        postId: reports.postId,
        commentId: reports.commentId,
        targetUserId: reports.targetUserId,
        message: reports.message,
        reporterId: reports.reporterId,
        reporterName: profiles.name,
      })
      .from(reports)
      .innerJoin(profiles, eq(profiles.id, reports.reporterId))
      .where(where)
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),

    db
      .select({ total: sql<number>`count(*)`.mapWith(Number) })
      .from(reports)
      .innerJoin(profiles, eq(profiles.id, reports.reporterId))
      .where(where)
      .then((r) => r[0]?.total ?? 0),
  ])

  const items = rows.map((r) => {
    const targetId =
      r.targetType === "post"
        ? r.postId
        : r.targetType === "comment"
          ? r.commentId
          : r.targetUserId

    return {
      id: r.id,
      createdAt: r.createdAt, // ISO-ish from pg timestamp
      status: r.status,
      reason: r.reason,
      targetType: r.targetType,
      targetId: targetId ?? "",
      reporter: { id: r.reporterId, name: r.reporterName ?? "Unknown" },
      summary: r.message ?? null,
    }
  })

  const total = totalRow
  const hasMore = page * limit < total

  return NextResponse.json({ items, page, limit, total, hasMore })
}
