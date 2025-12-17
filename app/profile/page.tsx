// app/profile/page.tsx
"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import {
  Bookmark,
  ExternalLink,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Loader2,
  MessageSquare,
  Heart,
  RefreshCcw,
  PodcastIcon,
} from "lucide-react"
import { FeedPost } from "@/utils/types"
import { PostCard } from "@/components/post-card"

type MyUser = {
  id: string
  name: string
  email: string
  image?: string | null
  role: "user" | "moderator" | "admin"
  isVerified: boolean
  joinedAt: string
}

type MyCommentRow = {
  id: string
  content: string
  createdAt: string
  postId: string
  postTitle: string
}

type SavedLikedRow = {
  postId: string
  savedAt?: string
  likedAt?: string
  post: FeedPost | null
}

type TabKey = "posts" | "comments" | "saved" | "liked" | "settings"

function RoleBadge({ role }: { role: MyUser["role"] }) {
  if (role === "admin") return <Badge>Admin</Badge>
  if (role === "moderator") return <Badge variant="secondary">Moderator</Badge>
  return <Badge variant="outline">User</Badge>
}

async function fetchJson<T>(
  url: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const res = await fetch(url, { cache: "no-store", credentials: "include" })
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

export default function MyProfilePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [tab, setTab] = useState<TabKey>("posts")

  const loaded = useRef({
    posts: false,
    comments: false,
    saved: false,
    liked: false,
  })

  // --- ME (loads once) ---
  const [me, setMe] = useState<MyUser | null>(null)
  const [loadingMe, setLoadingMe] = useState(true)
  const [meErr, setMeErr] = useState<string | null>(null)

  // --- POSTS ---
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [postsErr, setPostsErr] = useState<string | null>(null)

  // --- COMMENTS ---
  const [comments, setComments] = useState<MyCommentRow[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentsErr, setCommentsErr] = useState<string | null>(null)

  // --- SAVED ---
  const [saved, setSaved] = useState<SavedLikedRow[]>([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [savedErr, setSavedErr] = useState<string | null>(null)

  // --- LIKED ---
  const [liked, setLiked] = useState<SavedLikedRow[]>([])
  const [loadingLiked, setLoadingLiked] = useState(false)
  const [likedErr, setLikedErr] = useState<string | null>(null)

  // ---------- loaders (support force refresh) ----------
  const loadPosts = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!me?.id) return
      if (!opts?.force && loaded.current.posts) return

      loaded.current.posts = true
      setPostsErr(null)
      setLoadingPosts(true)

      const r = await fetchJson<{ items: FeedPost[] }>("/api/me/posts")
      if (!r.ok) {
        setPostsErr(r.error)
        setPosts([])
        setLoadingPosts(false)
        return
      }

      setPosts(r.data.items)
      setLoadingPosts(false)
    },
    [me?.id],
  )

  const loadComments = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!me?.id) return
      if (!opts?.force && loaded.current.comments) return

      loaded.current.comments = true
      setCommentsErr(null)
      setLoadingComments(true)

      const r = await fetchJson<{ items: MyCommentRow[] }>("/api/me/comments")
      if (!r.ok) {
        setCommentsErr(r.error)
        setComments([])
        setLoadingComments(false)
        return
      }

      setComments(r.data.items)
      setLoadingComments(false)
    },
    [me?.id],
  )

  const loadSaved = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!me?.id) return
      if (!opts?.force && loaded.current.saved) return

      loaded.current.saved = true
      setSavedErr(null)
      setLoadingSaved(true)

      const r = await fetchJson<{ items: SavedLikedRow[] }>("/api/me/saved")
      if (!r.ok) {
        setSavedErr(r.error)
        setSaved([])
        setLoadingSaved(false)
        return
      }

      setSaved(r.data.items)
      setLoadingSaved(false)
    },
    [me?.id],
  )

  const loadLiked = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!me?.id) return
      if (!opts?.force && loaded.current.liked) return

      loaded.current.liked = true
      setLikedErr(null)
      setLoadingLiked(true)

      const r = await fetchJson<{ items: SavedLikedRow[] }>("/api/me/liked")
      if (!r.ok) {
        setLikedErr(r.error)
        setLiked([])
        setLoadingLiked(false)
        return
      }

      setLiked(r.data.items)
      setLoadingLiked(false)
    },
    [me?.id],
  )

  // ---------- auth + me (once) ----------
  useEffect(() => {
    ; (async () => {
      setLoadingMe(true)

      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace("/auth/signin?redirect=/profile")
        return
      }

      const r = await fetchJson<any>("/api/me")
      if (!r.ok) {
        setMeErr(r.error)
        setMe(null)
        setLoadingMe(false)
        if (r.status === 401) router.replace("/auth/signin?redirect=/profile")
        return
      }

      setMe({
        id: r.data.id,
        name: r.data.name,
        email: r.data.email,
        image: r.data.image,
        role: r.data.role,
        isVerified: r.data.isVerified,
        joinedAt: new Date(r.data.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      })
      setMeErr(null)
      setLoadingMe(false)
    })()
  }, [router, supabase])

  // ---------- lazy-load per tab ----------
  useEffect(() => {
    if (!me?.id) return

    if (tab === "posts") void loadPosts()
    if (tab === "comments") void loadComments()
    if (tab === "saved") void loadSaved()
    if (tab === "liked") void loadLiked()
  }, [tab, me?.id, loadPosts, loadComments, loadSaved, loadLiked])

  if (loadingMe) {
    return (
      <div className="mx-auto w-full max-w-3xl py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading profile…
        </div>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="mx-auto w-full max-w-3xl py-10">
        <Card className="border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">Couldn’t load profile</CardTitle>
            <CardDescription>{meErr ?? "Unknown error"}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => router.refresh()}>
              Reload
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl py-8 px-4 ">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={me.image ?? undefined} alt={me.name} />
            <AvatarFallback>{me.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{me.name}</h1>
              {me.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  Verified
                </span>
              )}
              <RoleBadge role={me.role} />
            </div>

            <div className="text-sm text-muted-foreground">{me.email}</div>
            <div className="text-xs text-muted-foreground">Joined {me.joinedAt}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild className="gap-2">
            <Link href="/posts/upsert">
              <Plus className="h-4 w-4" />
              New post
            </Link>
          </Button>

          <Button variant="outline" asChild className="gap-2">
            <Link href="/posts">
              <PodcastIcon className="h-4 w-4" />
              Home
            </Link>
          </Button>

          <Button variant="outline" asChild className="gap-2">
            <Link href="/auth/signout">
              <LogOut className="h-4 w-4" />
              Logout
            </Link>
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="liked">Liked</TabsTrigger>
          {/* <TabsTrigger value="settings">Settings</TabsTrigger> */}
        </TabsList>

        {/* POSTS */}
        <TabsContent value="posts" className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Your posts</h2>
              <p className="text-sm text-muted-foreground">
                If a post is marked “Needs fix”, update it to avoid being hidden.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Input placeholder="Search your posts… (optional later)" className="sm:w-[280px]" />
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => loadPosts({ force: true })}
                disabled={loadingPosts}
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {loadingPosts ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : postsErr ? (
            <Card className="border-destructive/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-destructive">Failed to load posts</CardTitle>
                <CardDescription>{postsErr}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" onClick={() => loadPosts({ force: true })}>
                  Retry
                </Button>
              </CardFooter>
            </Card>
          ) : posts?.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">No posts yet</CardTitle>
                <CardDescription>Create your first post and start collecting testers.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link href="/posts/upsert">Create post</Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            posts?.map((p) => (
              <PostCard key={p.id} post={p} />
            ))
          )}
        </TabsContent>

        {/* COMMENTS */}
        <TabsContent value="comments" className="mt-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Your recent comments</h2>
              <p className="text-sm text-muted-foreground">Latest comments you posted + the post they belong to.</p>
            </div>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => loadComments({ force: true })}
              disabled={loadingComments}
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {loadingComments ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : commentsErr ? (
            <Card className="border-destructive/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-destructive">Failed to load comments</CardTitle>
                <CardDescription>{commentsErr}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" onClick={() => loadComments({ force: true })}>
                  Retry
                </Button>
              </CardFooter>
            </Card>
          ) : comments.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">No comments yet</CardTitle>
                <CardDescription>Comment on posts and they’ll show here.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <Card key={c.id}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <Link href={`/posts/show/${c.postId}`} className="hover:underline underline-offset-4">
                        {c.postTitle}
                      </Link>
                      <div className="ml-auto">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/posts/show/${c.postId}`} target="_blank">Open post</Link>
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>{new Date(c.createdAt).toLocaleString()}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="text-sm text-foreground/90 whitespace-pre-wrap">{c.content}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SAVED */}
        <TabsContent value="saved" className="mt-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Saved posts</h2>
              <p className="text-sm text-muted-foreground">Posts you bookmarked.</p>
            </div>

            <Button variant="outline" className="gap-2" onClick={() => loadSaved({ force: true })} disabled={loadingSaved}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {loadingSaved ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : savedErr ? (
            <div className="space-y-2">
              <div className="text-sm text-destructive">{savedErr}</div>
              <Button variant="outline" size="sm" onClick={() => loadSaved({ force: true })}>
                Retry
              </Button>
            </div>
          ) : saved?.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nothing saved yet.</div>
          ) : (
            <div className="space-y-4">
              {saved.map((r) =>
                r.post ? (
                  <div key={r.postId} className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Saved {r.savedAt ? new Date(r.savedAt).toLocaleString() : "—"}
                    </div>
                    <PostCard post={r.post} />
                  </div>
                ) : (
                  <Card key={r.postId}>
                    <CardHeader>
                      <CardTitle className="text-base">Post deleted</CardTitle>
                      <CardDescription>This saved post no longer exists.</CardDescription>
                    </CardHeader>
                  </Card>
                ),
              )}
            </div>
          )}
        </TabsContent>

        {/* LIKED */}
        <TabsContent value="liked" className="mt-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Liked posts</h2>
              <p className="text-sm text-muted-foreground">Posts you liked.</p>
            </div>

            <Button variant="outline" className="gap-2" onClick={() => loadLiked({ force: true })} disabled={loadingLiked}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardContent className="overflow-x-auto">
              {loadingLiked ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : likedErr ? (
                <div className="space-y-2">
                  <div className="text-sm text-destructive">{likedErr}</div>
                  <Button variant="outline" size="sm" onClick={() => loadLiked({ force: true })}>
                    Retry
                  </Button>
                </div>
              ) : liked.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nothing liked yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[70%]">Post</TableHead>
                      <TableHead className="text-right">Liked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liked.map((r) => (
                      <TableRow key={r.postId}>
                        <TableCell className="min-w-[340px]">
                          {r.post ? (
                            <Link href={`/posts/show/${r.post.id}`} target="_blank" className="inline-flex items-center gap-2 hover:underline underline-offset-4">
                              <Heart className="h-4 w-4" />
                              {r.post.title}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">Post deleted</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {r.likedAt ? new Date(r.likedAt).toLocaleString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="text-sm text-muted-foreground">Read-only for now.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account</CardTitle>
                <CardDescription>Basic account state.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="text-muted-foreground">Role</div>
                  <div className="font-medium">{me.role}</div>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground">Verification</div>
                  <div className="font-medium">{me.isVerified ? "Verified" : "Not verified"}</div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" asChild className="gap-2">
                  <Link href="/verify">
                    <ShieldCheck className="h-4 w-4" />
                    Manage verification
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preferences</CardTitle>
                <CardDescription>Customize your experience.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  Add preferences here later.
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Edit preferences
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
