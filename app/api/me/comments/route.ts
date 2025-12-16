import { NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { comments, posts } from "@/drizzle/schema"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  const supabase = createClient(await cookies())
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = auth.user.id

  const rows = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      postId: comments.postId,
      postTitle: posts.title,
    })
    .from(comments)
    .innerJoin(posts, eq(posts.id, comments.postId))
    .where(eq(comments.authorId, userId))
    .orderBy(desc(comments.createdAt))
    .limit(30)

  return NextResponse.json({ items: rows })
}
