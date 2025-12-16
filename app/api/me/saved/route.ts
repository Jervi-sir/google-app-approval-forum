import { NextResponse } from "next/server"
import { desc, eq, inArray } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { postSaves, posts } from "@/drizzle/schema"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  const supabase = createClient(await cookies())
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = auth.user.id

  const saved = await db
    .select({ postId: postSaves.postId, createdAt: postSaves.createdAt })
    .from(postSaves)
    .where(eq(postSaves.userId, userId))
    .orderBy(desc(postSaves.createdAt))
    .limit(50)

  const ids = saved.map((s) => s.postId)
  const postsRows = ids.length
    ? await db
      .select({ id: posts.id, title: posts.title, createdAt: posts.createdAt })
      .from(posts)
      .where(inArray(posts.id, ids))
    : []

  const byId = new Map(postsRows.map((p) => [p.id, p]))
  return NextResponse.json({
    items: saved.map((s) => ({
      postId: s.postId,
      savedAt: s.createdAt,
      post: byId.get(s.postId) ?? null,
    })),
  })
}
