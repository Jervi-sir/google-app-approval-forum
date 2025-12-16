import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { and, desc, eq } from "drizzle-orm"

import { createClient } from "@/utils/supabase/server"
import { db } from "@/drizzle/db"
import { verificationRequests } from "@/drizzle/schema"

type Body = {
  playStoreDeveloperUrl?: string | null
  proofMessage?: string
}

function cleanUrl(input: unknown): string | null {
  const s = String(input ?? "").trim()
  if (!s) return null
  try {
    const u = new URL(s)
    if (u.protocol !== "http:" && u.protocol !== "https:") return null
    return u.toString()
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  // --- auth guard ---
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = auth.user.id

  // --- body ---
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const proofMessage = (body.proofMessage ?? "").trim()
  if (proofMessage.length < 20) {
    return NextResponse.json({ error: "Proof message is too short" }, { status: 400 })
  }

  const playStoreDeveloperUrl = cleanUrl(body.playStoreDeveloperUrl)

  // --- prevent duplicate pending requests ---
  const pending = await db
    .select({ id: verificationRequests.id })
    .from(verificationRequests)
    .where(and(eq(verificationRequests.userId, userId), eq(verificationRequests.status, "pending")))
    .limit(1)
    .then((r) => r[0])

  if (pending) {
    return NextResponse.json(
      { error: "You already have a pending verification request." },
      { status: 409 },
    )
  }

  // (optional) also block re-request spam by checking latest status
  // e.g. allow if last is rejected; allow if not_requested; block if approved
  const latest = await db
    .select({ status: verificationRequests.status })
    .from(verificationRequests)
    .where(eq(verificationRequests.userId, userId))
    .orderBy(desc(verificationRequests.createdAt))
    .limit(1)
    .then((r) => r[0])

  if (latest?.status === "approved") {
    return NextResponse.json(
      { error: "You are already approved." },
      { status: 409 },
    )
  }

  // --- insert request ---
  await db.insert(verificationRequests).values({
    userId,
    playStoreDeveloperUrl,
    proofMessage,
    // status defaults to "pending" in schema
  })

  return NextResponse.json({ ok: true })
}
