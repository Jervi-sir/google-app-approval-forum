import { notFound } from "next/navigation"
import { db } from "@/drizzle/db"
import { posts } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

import MiraTemplate from "../templates/mira-template"
import DefaultTemplate from "../templates/default-template"
import GlassUiTemplate from "../templates/glass-ui-template"
import MinimalistFournitureTemplate from "../templates/minimalist-fourniture"

// Force dynamic rendering since we depend on params/db data that changes
export const dynamic = "force-dynamic"

interface SharePageProps {
  params: Promise<{ id: string }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params

  // 1. Fetch post
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, id),
    columns: {
      id: true,
      title: true,
      content: true,
      googleGroupUrl: true,
      playStoreUrl: true,
      templateCode: true,
      templateName: true,
    },
  })

  if (!post) {
    notFound()
  }

  // 2. Decide template
  const isMira = post.templateCode === "TMP-MIRA"
  const isGlassUi = post.templateCode === "TMP-GLASSUI"
  const isMinimalistFourniture = post.templateCode === "TMP-MINIMALIST_FOURNITURE"

  // 3. Render
  if (isMira) {
    return (
      <MiraTemplate
        playStoreUrl={post.playStoreUrl ?? "#"}
        googleGroupUrl={post.googleGroupUrl ?? "#"}
      />
    )
  }

  if (isGlassUi) {
    return (
      <GlassUiTemplate
        playStoreUrl={post.playStoreUrl ?? "#"}
        googleGroupUrl={post.googleGroupUrl ?? "#"}
      />
    )
  }

  if (isMinimalistFourniture) {
    return (
      <MinimalistFournitureTemplate
        playStoreUrl={post.playStoreUrl ?? "#"}
        googleGroupUrl={post.googleGroupUrl ?? "#"}
      />
    )
  }

  // Fallback / standard
  return (
    <DefaultTemplate
      title={post.title}
      content={post.content}
      googleGroupUrl={post.googleGroupUrl ?? undefined}
      playStoreUrl={post.playStoreUrl ?? undefined}
    />
  )
}
