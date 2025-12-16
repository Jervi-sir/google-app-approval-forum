import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { desc, eq } from "drizzle-orm"

import { createClient } from "@/utils/supabase/server"
import { db } from "@/drizzle/db"
import { profiles, verificationRequests } from "@/drizzle/schema"

type VerificationState =
  | { status: "not_requested" }
  | { status: "pending"; submittedAt: string }
  | { status: "approved"; approvedAt: string; note?: string }
  | { status: "rejected"; reviewedAt: string; note?: string }

export async function GET() {
  // --- auth guard ---
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = auth.user.id

  // --- load user role + verified ---
  const p = await db
    .select({
      role: profiles.role,
      isVerified: profiles.isVerified,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
    .then((r) => r[0])

  const role = p?.role ?? "user"
  const isVerified = p?.isVerified ?? false

  // --- latest verification request (if any) ---
  const latest = await db
    .select({
      status: verificationRequests.status,
      createdAt: verificationRequests.createdAt,
      updatedAt: verificationRequests.updatedAt,
      reviewNote: verificationRequests.reviewNote,
      reviewedById: verificationRequests.reviewedById,
    })
    .from(verificationRequests)
    .where(eq(verificationRequests.userId, userId))
    .orderBy(desc(verificationRequests.createdAt))
    .limit(1)
    .then((r) => r[0])

  let state: VerificationState = { status: "not_requested" }

  if (latest) {
    if (latest.status === "pending") {
      state = {
        status: "pending",
        submittedAt: new Date(latest.createdAt).toLocaleString(),
      }
    } else if (latest.status === "approved") {
      state = {
        status: "approved",
        approvedAt: new Date(latest.updatedAt ?? latest.createdAt).toLocaleString(),
        note: latest.reviewNote ?? undefined,
      }
    } else {
      state = {
        status: "rejected",
        reviewedAt: new Date(latest.updatedAt ?? latest.createdAt).toLocaleString(),
        note: latest.reviewNote ?? undefined,
      }
    }
  }

  return NextResponse.json({
    user: { id: userId, role, isVerified },
    state,
  })
}
