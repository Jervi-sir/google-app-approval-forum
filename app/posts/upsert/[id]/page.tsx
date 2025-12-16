import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { posts, postTags, tags, postImages } from "@/drizzle/schema"
import { PostForm, type PostData } from "@/app/posts/upsert/post-form"
import { db } from "@/drizzle/db"

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // ✅ Next 15: unwrap params
  const { id } = await params

  const postId = z.string().uuid().safeParse(id)
  if (!postId.success) notFound()

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId.data),
    columns: {
      id: true,
      title: true,
      content: true,
      playStoreUrl: true,
      googleGroupUrl: true,
      moderationStatus: true,
      isDeleted: true,
    },
  })

  if (!post || post.isDeleted) notFound()
  if (post.moderationStatus === "hidden") notFound()

  const tagRows = await db
    .select({ name: tags.name })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .where(eq(postTags.postId, post.id))

  const imageRows = await db
    .select({ url: postImages.url, position: postImages.position })
    .from(postImages)
    .where(eq(postImages.postId, post.id))
    .orderBy(postImages.position)

  const postData: PostData = {
    id: post.id,
    title: post.title,
    content: post.content,
    playStoreUrl: post.playStoreUrl ?? "",
    googleGroupUrl: post.googleGroupUrl ?? "",
    tags: tagRows.map((t) => t.name),
    images: imageRows.map((i) => i.url),
    moderationStatus: post.moderationStatus ?? "ok",
  }

  return <PostForm post={postData} />
}
