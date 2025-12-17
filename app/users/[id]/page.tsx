"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ShieldCheck, Loader2 } from "lucide-react"
import ReportUserDialog from "./report-user-dialog"

type PublicUser = {
  id: string
  name: string
  image?: string | null
  isVerified: boolean
  joinedAt: string
  stats: { posts: number; likes: number; saves: number }
}

type UserPost = {
  id: string
  title: string
  excerpt: string
  createdAt: string
  tags: string[]
  moderationStatus: "ok" | "needs_fix" | "hidden"
  counts: { likes: number; comments: number; saves: number }
}

type PostsResponse = {
  items: UserPost[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

function useDebounced(value: string, ms: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

async function fetchJson<T>(url: string): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try {
      const j = await res.json()
      msg = j?.error ? String(j.error) : msg
    } catch { }
    return { ok: false, status: res.status, error: msg }
  }
  return { ok: true, data: (await res.json()) as T }
}

export default function PublicUserPage() {
  const params = useParams<{ id?: string }>()
  const router = useRouter()
  const id = (params?.id ?? "") as string

  const [user, setUser] = useState<PublicUser | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [userErr, setUserErr] = useState<string | null>(null)

  const [q, setQ] = useState("")
  const qDebounced = useDebounced(q, 300)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const [postsData, setPostsData] = useState<PostsResponse>({ items: [], page: 1, limit, total: 0, hasMore: false })
  const [postsLoading, setPostsLoading] = useState(true)
  const [postsErr, setPostsErr] = useState<string | null>(null)

  const postsQs = useMemo(() => {
    const sp = new URLSearchParams()
    sp.set("page", String(page))
    sp.set("limit", String(limit))
    if (qDebounced.trim()) sp.set("q", qDebounced.trim())
    return sp.toString()
  }, [page, limit, qDebounced])

  useEffect(() => {
    if (!id) return

      ; (async () => {
        setUserLoading(true)
        setUserErr(null)
        const r = await fetchJson<Omit<PublicUser, "joinedAt"> & { joinedAt: string | Date }>(`/api/users/${id}/detail`)
        if (!r.ok) {
          setUser(null)
          setUserErr(r.error)
          setUserLoading(false)
          if (r.status === 404) router.replace("/404")
          return
        }
        const joinedAt = new Date(r.data.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        setUser({ ...r.data, joinedAt })
        setUserLoading(false)
      })()
  }, [id, router])

  useEffect(() => {
    if (!id) return

      ; (async () => {
        setPostsLoading(true)
        setPostsErr(null)
        const r = await fetchJson<PostsResponse>(`/api/users/${id}/posts?${postsQs}`)
        if (!r.ok) {
          setPostsErr(r.error)
          setPostsData({ items: [], page, limit, total: 0, hasMore: false })
          setPostsLoading(false)
          return
        }
        setPostsData(r.data)
        setPostsLoading(false)
      })()
  }, [id, postsQs, page, limit])

  if (userLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading profile…
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl py-10 space-y-4">
        <Button asChild variant="ghost">
          <Link href="/posts">← Back</Link>
        </Button>
        <Card className="border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">Couldn’t load user</CardTitle>
            <CardDescription>{userErr ?? "Unknown error"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl py-8 px-4 ">
      {/* Top nav */}
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/posts">← Back</Link>
        </Button>

        <div className="flex items-center gap-2">
          <ReportUserDialog targetUserId={user.id} targetName={user.name} />
        </div>
      </div>

      {/* Profile header */}
      <div className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
                    {user.isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs text-foreground">
                        <ShieldCheck className="h-4 w-4" />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">Joined {user.joinedAt}</div>
                </div>
              </div>

              <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-[300px]">
                <div className="rounded-md border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Posts</div>
                  <div className="text-lg font-semibold">{user.stats.posts}</div>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Likes</div>
                  <div className="text-lg font-semibold">{user.stats.likes}</div>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Saves</div>
                  <div className="text-lg font-semibold">{user.stats.saves}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Posts */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Posts by {user.name}</h2>
          <p className="text-sm text-muted-foreground">Browse their shared apps.</p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder={`Search ${user.name}'s posts…`}
            className="sm:w-[280px]"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {postsErr ? (
        <Card className="mt-4 border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">Couldn’t load posts</CardTitle>
            <CardDescription>{postsErr}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="mt-4 space-y-4">
        {postsLoading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading posts…
          </div>
        ) : postsData.items.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">No posts</CardTitle>
              <CardDescription>This user hasn’t posted anything yet.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          postsData.items.map((p) => (
            <Card key={p.id}>
              <CardHeader className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      <Link href={`/posts/${p.id}`} className="hover:underline underline-offset-4">
                        {p.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">• {new Date(p.createdAt).toLocaleString()}</span>
                      {p.moderationStatus === "needs_fix" && <Badge variant="destructive">Needs fix</Badge>}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" asChild>
                      <Link href={`/posts/${p.id}`}>Open</Link>
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm leading-relaxed text-foreground/90">{p.excerpt}</p>
              </CardContent>

              <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20">
                <div className="text-sm text-muted-foreground">
                  ❤️ {p.counts.likes} · 💬 {p.counts.comments} · 🔖 {p.counts.saves}
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/posts/${p.id}`}>View details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {postsData.items.length} • total {postsData.total}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={postsLoading || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <Button variant="outline" disabled={postsLoading || !postsData.hasMore} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
