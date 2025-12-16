"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Bookmark, Heart, MessageSquare, Search, ShieldCheck, Trash2, Loader2 } from "lucide-react"
import { useAuthUser } from "@/utils/hooks/use-auth-user"
import { UserNav } from "@/components/user-nav"
import { PostCard } from "@/components/post-card"
import { FeedPost } from "@/utils/types"


type ApiRes = {
  items: FeedPost[]
  page: number
  limit: number
  total: number
  hasMore: boolean
  error?: string
}

function formatTimeLabel(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

export default function SavedPostsPage() {
  const { loading, authorId, isAuthed } = useAuthUser()

  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const [items, setItems] = useState<FeedPost[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const canFetch = !loading && isAuthed && !!authorId

  const fetchSaved = async (nextPage: number) => {
    if (!authorId) return

    setBusy(true)
    setError(null)

    try {
      const qs = new URLSearchParams()
      qs.set("userId", authorId)
      qs.set("page", String(nextPage))
      qs.set("limit", String(limit))
      if (q.trim()) qs.set("q", q.trim())

      const res = await fetch(`/api/saved-posts?${qs.toString()}`, { cache: "no-store" })
      const json: ApiRes = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to load saved posts")

      setItems(json.items)
      setTotal(json.total)
      setHasMore(json.hasMore)
      setPage(json.page)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load saved posts")
    } finally {
      setBusy(false)
    }
  }

  // initial + when page changes
  useEffect(() => {
    if (!canFetch) return
    fetchSaved(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, page])

  // search with small debounce
  useEffect(() => {
    if (!canFetch) return
    const t = setTimeout(() => {
      setPage(1)
      fetchSaved(1)
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, canFetch])

  const onRemove = async (postId: string) => {
    if (!authorId) return
    setRemovingId(postId)
    setError(null)

    try {
      // reuse your toggle save endpoint
      const res = await fetch(`/api/posts/${postId}/save`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: authorId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to remove")

      // refresh current page (avoid empty page edge-case)
      await fetchSaved(page)
      if (page > 1 && items.length === 1) {
        setPage(page - 1)
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to remove saved post")
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) return null

  if (!isAuthed || !authorId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sign in required</CardTitle>
            <CardDescription>Login to see your saved posts.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/login">Go to login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Saved posts</h1>
          <p className="text-sm text-muted-foreground">Your personal list. Come back later to test or leave feedback.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/posts">Back to posts</Link>
          </Button>
          <UserNav />
        </div>
      </div>

      <Separator className="my-6" />

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search saved posts…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            {total} saved
          </span>
        </div>
      </div>

      <Separator className="my-6" />

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {busy ? (
        <Card>
          <CardContent className="py-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nothing saved yet</CardTitle>
            <CardDescription>Save posts from the feed to keep track of apps you want to test later.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/posts">Browse posts</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-between">
        <Button variant="outline" disabled={busy || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {page}
        </div>
        <Button variant="outline" disabled={busy || !hasMore} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}
