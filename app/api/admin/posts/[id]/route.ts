import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { posts, profiles } from "@/drizzle/schema"

// OPTIONAL auth gate
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { db } from "@/drizzle/db"

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  // ---- Optional admin/mod gate ----
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
  // --------------------------------

  const body = await req.json().catch(() => ({} as any))

  const action = body?.action as
    | "mark_ok"
    | "mark_needs_fix"
    | "hide"
    | "soft_delete"
    | "restore"

  if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 })

  if (action === "mark_ok") {
    await db.update(posts).set({ moderationStatus: "ok", updatedAt: new Date() }).where(eq(posts.id, id))
  } else if (action === "mark_needs_fix") {
    await db.update(posts).set({ moderationStatus: "needs_fix", updatedAt: new Date() }).where(eq(posts.id, id))
  } else if (action === "hide") {
    await db.update(posts).set({ moderationStatus: "hidden", updatedAt: new Date() }).where(eq(posts.id, id))
  } else if (action === "soft_delete") {
    await db
      .update(posts)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: auth.user.id,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
  } else if (action === "restore") {
    await db
      .update(posts)
      .set({
        isDeleted: false,
        deletedAt: null,
        deletedById: null,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
