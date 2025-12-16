import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { reports, profiles } from "@/drizzle/schema"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

const Allowed = new Set(["open", "reviewing", "resolved", "rejected"])

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

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

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const nextStatus = String(body?.status ?? "")
  if (!Allowed.has(nextStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const resolutionNote =
    body?.resolutionNote != null && String(body.resolutionNote).trim()
      ? String(body.resolutionNote).trim()
      : null

  const isFinal = nextStatus === "resolved" || nextStatus === "rejected"

  const updated = await db
    .update(reports)
    .set({
      status: nextStatus as any,
      updatedAt: new Date(),
      resolvedById: isFinal ? auth.user.id : null,
      resolutionNote: isFinal ? resolutionNote : null,
    })
    .where(eq(reports.id, id))
    .returning({ id: reports.id })

  if (!updated.length) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ ok: true })
}
