"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { z } from "zod"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, ShieldCheck, Loader2 } from "lucide-react"

import { ReportDialog } from "./report-dialog"
import { PostActions } from "./post-actions"
import { CommentsSection } from "./comments-section"
import { useAuthUser } from "@/utils/hooks/use-auth-user"

type TagItem = { id: string; name: string; slug: string }
type ImageItem = { id: string; url: string; position: number }

type PostApi = {
  post: {
    id: string
    title: string
    content: string
    playStoreUrl: string | null
    googleGroupUrl: string | null
    moderationStatus?: "ok" | "needs_fix" | "hidden"
    createdAt: string
    updatedAt: string
    author: { id: string; name: string | null; image?: string | null; isVerified?: boolean | null }
    tags: TagItem[]
    images: ImageItem[]
    counts: { likes: number; saves: number; comments: number }
    viewer: { likedByMe: boolean; savedByMe: boolean }
  }
}

function initials(name?: string | null) {
  const n = (name ?? "").trim()
  if (!n) return "??"
  const parts = n.split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("").padEnd(2, "?")
}

// Replace this with your real user id source (Supabase session, store, etc.)
function useCurrentUserId(): string | null {
  const { authorId } = useAuthUser();
  // Example: load from localStorage (ONLY if you already do this)
  // return typeof window !== "undefined" ? localStorage.getItem("userId") : null
  return authorId ?? null
}

const UuidSchema = z.string().uuid()

function formatTimeLabel(isoOrText: string) {
  const d = new Date(isoOrText)
  if (Number.isNaN(d.getTime())) return isoOrText
  return d.toLocaleString()
}

export default function PostDetailPage() {
  const params = useParams<{ id: string }>()
  const postIdRaw = params?.id

  const viewerId = useCurrentUserId()

  const postId = useMemo(() => {
    try {
      return UuidSchema.parse(postIdRaw)
    } catch {
      return null
    }
  }, [postIdRaw])

  const [loadingPost, setLoadingPost] = useState(true)
  const [post, setPost] = useState<PostApi["post"] | null>(null)
  const [postError, setPostError] = useState<string | null>(null)

  const [likeBusy, setLikeBusy] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)

  async function fetchPost() {
    if (!postId) {
      setPostError("Invalid post id")
      setLoadingPost(false)
      return
    }

    // Don't set loading back to true here to avoid flickering on re-fetches for count updates
    if (!post) setLoadingPost(true)
    setPostError(null)

    try {
      const qs = new URLSearchParams()
      if (viewerId) qs.set("viewerId", viewerId)

      const res = await fetch(`/api/posts/${postId}?${qs.toString()}`, { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to load post")

      setPost(json.post)
    } catch (e: any) {
      setPostError(e?.message ?? "Failed to load post")
      // Don't nullify post if we are just refreshing counts, unless it was a 404
      if (!post) setPost(null)
    } finally {
      setLoadingPost(false)
    }
  }

  useEffect(() => {
    fetchPost()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, viewerId])

  async function onToggleLike() {
    if (!post || !postId) return
    if (!viewerId) {
      setPostError("You must be logged in to like.")
      return
    }

    setLikeBusy(true)
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: viewerId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to like")

      setPost((p) =>
        p
          ? {
            ...p,
            viewer: { ...p.viewer, likedByMe: json.liked },
            counts: { ...p.counts, likes: json.likesCount },
          }
          : p
      )
    } catch (e: any) {
      setPostError(e?.message ?? "Failed to like")
    } finally {
      setLikeBusy(false)
    }
  }

  async function onToggleSave() {
    if (!post || !postId) return
    if (!viewerId) {
      setPostError("You must be logged in to save.")
      return
    }

    setSaveBusy(true)
    try {
      const res = await fetch(`/api/posts/${postId}/save`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: viewerId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to save")

      setPost((p) =>
        p
          ? {
            ...p,
            viewer: { ...p.viewer, savedByMe: json.saved },
            counts: { ...p.counts, saves: json.savesCount },
          }
          : p
      )
    } catch (e: any) {
      setPostError(e?.message ?? "Failed to save")
    } finally {
      setSaveBusy(false)
    }
  }

  if (loadingPost) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardContent className="py-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading post…
          </CardContent>
        </Card>
      </div>
    )
  }

  if (postError || !post) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Couldn’t load post</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{postError ?? "Unknown error"}</CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/posts">Back to posts</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (post.moderationStatus === "hidden") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This content is unavailable</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This post was hidden by moderation or removed by the author.
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/posts">Back to posts</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Top nav */}
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/posts">← Back</Link>
        </Button>

        <div className="flex items-center gap-2">
          {post.author.id === viewerId
            && <Button variant="outline" asChild>
              <Link href={`/posts/upsert/${post.id}`}>Edit</Link>
            </Button>
          }
          <ReportDialog targetLabel="post" />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {/* Title + meta */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/users/${post.author.id}`} className="inline-flex items-center gap-2 hover:underline underline-offset-4">
              <Avatar className="h-6 w-6">
                <AvatarImage src={post.author.image ?? undefined} alt={post.author.name ?? "User"} />
                <AvatarFallback>{initials(post.author.name)}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{post.author.name ?? "Unknown"}</span>
            </Link>

            {post.author.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs text-foreground">
                <ShieldCheck className="h-4 w-4" />
                Verified
              </span>
            )}

            <span className="text-xs">• {formatTimeLabel(post.createdAt)}</span>

            {post.moderationStatus === "needs_fix" && <Badge variant="destructive">Needs fix</Badge>}
          </div>

          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Badge key={t.id} variant="secondary">
                {t.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* CTA cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 1 — Join Google Group</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Join first so Play Store recognizes you as invited.</p>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Google Group URL</div>
                <div className="truncate text-sm font-medium">{post.googleGroupUrl ?? "—"}</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full gap-2" disabled={!post.googleGroupUrl}>
                <a href={post.googleGroupUrl ?? "#"} target="_blank" rel="noreferrer">
                  Open group <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 2 — Install from Play Store</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">After joining, install from the Play Store listing.</p>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Play Store URL</div>
                <div className="truncate text-sm font-medium">{post.playStoreUrl ?? "—"}</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="secondary" className="w-full gap-2" disabled={!post.playStoreUrl}>
                <a href={post.playStoreUrl ?? "#"} target="_blank" rel="noreferrer">
                  Open Play Store <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Body */}
        <Card>
          <CardHeader >
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{post.content}</p>
          </CardContent>
        </Card>

        {/* Actions */}
        <PostActions
          likedByMe={post.viewer.likedByMe}
          savedByMe={post.viewer.savedByMe}
          likesCount={post.counts.likes}
          savesCount={post.counts.saves}
          commentsCount={post.counts.comments}
          onToggleLike={onToggleLike}
          onToggleSave={onToggleSave}
          likeBusy={likeBusy}
          saveBusy={saveBusy}
        />

        {postError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {postError}
          </div>
        )}

        {/* Comments section */}
        <CommentsSection
          postId={post.id}
          onCommentCountChange={fetchPost}
        />

      </div>
    </div>
  )
}
