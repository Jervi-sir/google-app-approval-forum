// app/admin/posts/[id]/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ExternalLink, EyeOff, ShieldAlert, Trash2, Loader2 } from "lucide-react"
import { isUuid } from "@/lib/uuid"

type AdminPostDetail = {
  id: string
  title: string
  content: string
  playStoreUrl: string | null
  googleGroupUrl: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
  moderationStatus: "ok" | "needs_fix" | "hidden"
  isDeleted: boolean
  author: { id: string; name: string; isVerified?: boolean }
  counts: { reports: number; likes: number; saves: number; comments: number }
}

function StatusBadge({
  status,
  isDeleted,
}: {
  status: AdminPostDetail["moderationStatus"]
  isDeleted: boolean
}) {
  if (isDeleted) return <Badge variant="secondary">Deleted</Badge>
  if (status === "needs_fix") return <Badge variant="destructive">Needs fix</Badge>
  if (status === "hidden") return <Badge variant="secondary">Hidden</Badge>
  return <Badge variant="outline">OK</Badge>
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; status?: number; message: string }
  | { kind: "ready"; post: AdminPostDetail }

export default function AdminPostDetailPage() {
  const params = useParams<{ id?: string }>()
  const router = useRouter()
  const id = (params?.id ?? "") as string

  const [state, setState] = useState<LoadState>({ kind: "loading" })

  const isValidId = useMemo(() => !!id && isUuid(id), [id])

  useEffect(() => {
    if (!id) return
    if (!isValidId) {
      setState({ kind: "error", status: 404, message: "Invalid post id." })
      return
    }

    const abort = new AbortController()
      ; (async () => {
        setState({ kind: "loading" })
        try {
          const res = await fetch(`/api/admin/posts/${id}/detail`, {
            method: "GET",
            credentials: "include", // ✅ ensure cookies are sent
            cache: "no-store",
            signal: abort.signal,
          })

          if (!res.ok) {
            let msg = `Request failed (${res.status})`
            try {
              const j = await res.json()
              msg = j?.error ? String(j.error) : msg
            } catch { }
            setState({ kind: "error", status: res.status, message: msg })

            // optional: route unauthorized/forbidden to your pages
            if (res.status === 401) router.replace("/login")
            if (res.status === 403) router.replace("/403")
            return
          }

          const post = (await res.json()) as AdminPostDetail
          setState({ kind: "ready", post })
        } catch (e: any) {
          if (e?.name === "AbortError") return
          setState({ kind: "error", message: e?.message ?? "Unknown error" })
        }
      })()

    return () => abort.abort()
  }, [id, isValidId, router])

  if (state.kind === "loading") {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading post…
        </div>
      </div>
    )
  }

  if (state.kind === "error") {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 space-y-4">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" onClick={() => window.history.back()}>
            <Link href="">← Back</Link>
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {state.message}
            {state.status ? ` (status: ${state.status})` : null}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const post = state.post

  const suspiciousGroup = (post.googleGroupUrl ?? "").startsWith("http://")
  const isNeedsFix = post.moderationStatus === "needs_fix"
  const isHidden = post.moderationStatus === "hidden"

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      {/* Top nav */}
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" >
          <Link href="">← Back</Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link href={`/posts/${post.id}`}>
              <ExternalLink className="h-4 w-4" />
              View on site
            </Link>
          </Button>

          <Button variant="destructive" asChild className="gap-2">
            <Link href={`/admin/posts/${post.id}#actions`}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Link>
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
          <StatusBadge status={post.moderationStatus} isDeleted={post.isDeleted} />
          {post.author.isVerified && <Badge>Author Verified</Badge>}
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="font-mono">{post.id}</span> • Created{" "}
          {new Date(post.createdAt).toLocaleString()} • Updated{" "}
          {new Date(post.updatedAt).toLocaleString()}
        </div>

        <div className="text-sm text-muted-foreground">
          Author:{" "}
          <Link
            href={`/admin/users/${post.author.id}`}
            className="font-medium text-foreground hover:underline underline-offset-4"
          >
            {post.author.name}
          </Link>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Warnings */}
      <div className="space-y-3">
        {isNeedsFix && (
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Needs fix</AlertTitle>
            <AlertDescription>This post requires updates to meet guidelines.</AlertDescription>
          </Alert>
        )}

        {isHidden && (
          <Alert>
            <EyeOff className="h-4 w-4" />
            <AlertTitle>Hidden</AlertTitle>
            <AlertDescription>
              This post is currently hidden from normal users. Review reports before restoring.
            </AlertDescription>
          </Alert>
        )}

        {suspiciousGroup && (
          <Alert>
            <AlertTitle>Suspicious link</AlertTitle>
            <AlertDescription>Google Group URL is not HTTPS. Consider hiding the post.</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Left: Post content */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Post content</CardTitle>
              <CardDescription>Review the content and links.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Google Group URL</Label>
                <Input value={post.googleGroupUrl ?? ""} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Play Store URL</Label>
                <Input value={post.playStoreUrl ?? ""} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Details</Label>
                <Textarea value={post.content} readOnly className="min-h-[180px]" />
              </div>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Moderator note</CardTitle>
              <CardDescription>UI-only for now.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                placeholder="Example: Please add clearer steps: Join group → wait 5–10 min → open Play Store link."
                className="min-h-[120px]"
              />
              <div className="text-xs text-muted-foreground">
                If you want this saved, add a `post_moderation_notes` table.
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" disabled>
                Save note
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right: stats */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stats</CardTitle>
              <CardDescription>Signals and engagement.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                ["Reports", post.counts.reports],
                ["Likes", post.counts.likes],
                ["Saves", post.counts.saves],
                ["Comments", post.counts.comments],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-md border p-3 text-center">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-lg font-semibold">{value as any}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Links</CardTitle>
              <CardDescription>Open externally to verify quickly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full gap-2" disabled={!post.googleGroupUrl}>
                <a href={post.googleGroupUrl ?? "#"} target="_blank" rel="noreferrer">
                  Open Google Group <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full gap-2" disabled={!post.playStoreUrl}>
                <a href={post.playStoreUrl ?? "#"} target="_blank" rel="noreferrer">
                  Open Play Store <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <div id="actions" />
        </div>
      </div>
    </div>
  )
}
