import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { profiles, reports } from "@/drizzle/schema"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

const AllowedReasons = new Set(["spam", "malware", "hate", "harassment", "copyright", "other"])
const AllowedTargets = new Set(["post", "comment", "user"])

export async function POST(req: Request) {
  const supabase = createClient(await cookies())
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const targetType = String(body?.targetType ?? "")
  const reason = String(body?.reason ?? "")
  const message = body?.message != null ? String(body.message).trim() : null

  if (!AllowedTargets.has(targetType)) return NextResponse.json({ error: "Invalid targetType" }, { status: 400 })
  if (!AllowedReasons.has(reason)) return NextResponse.json({ error: "Invalid reason" }, { status: 400 })
  if (message && message.length > 2000) return NextResponse.json({ error: "Message too long" }, { status: 400 })

  const targetUserId = body?.targetUserId != null ? String(body.targetUserId) : null
  const postId = body?.postId != null ? String(body.postId) : null
  const commentId = body?.commentId != null ? String(body.commentId) : null

  // enforce exactly one target id depending on targetType
  if (targetType === "user" && !targetUserId) return NextResponse.json({ error: "targetUserId required" }, { status: 400 })
  if (targetType === "post" && !postId) return NextResponse.json({ error: "postId required" }, { status: 400 })
  if (targetType === "comment" && !commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 })

  // basic “self-report” guard for user reports
  if (targetType === "user" && targetUserId === auth.user.id) {
    return NextResponse.json({ error: "You can't report yourself" }, { status: 400 })
  }

  // make sure reporter profile exists (optional but nice)
  const me = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, auth.user.id)).limit(1)
  if (!me.length) return NextResponse.json({ error: "Profile missing" }, { status: 400 })

  await db.insert(reports).values({
    reporterId: auth.user.id,
    targetType: targetType as any,
    reason: reason as any,
    message,

    targetUserId: targetType === "user" ? targetUserId : null,
    postId: targetType === "post" ? postId : null,
    commentId: targetType === "comment" ? commentId : null,

    status: "open",
  })

  return NextResponse.json({ ok: true })
}
