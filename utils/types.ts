export type FeedPost = {
  id: string
  title: string
  content: string
  playStoreUrl: string
  googleGroupUrl: string
  excerpt: string
  tags: string[]
  createdAt: string
  author: {
    id: string
    name: string | null
    image?: string
    isVerified?: boolean | null
  }
  counts: {
    likes: number
    comments: number
    saves: number
  }
  moderationStatus?: "ok" | "needs_fix" | "hidden"
  savedAt: string
}