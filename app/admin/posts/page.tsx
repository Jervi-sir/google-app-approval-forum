"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, ExternalLink, Filter, ShieldAlert, Trash2, EyeOff, Loader2 } from "lucide-react"

type AdminPostRow = {
  id: string
  title: string
  author: { id: string; name: string; isVerified?: boolean }
  createdAt: string // ISO from API; we'll format lightly
  tags: string[]
  moderationStatus: "ok" | "needs_fix" | "hidden"
  isDeleted: boolean
  reportsCount: number
  likesCount: number
  commentsCount: number
}

type ListResp = {
  items: AdminPostRow[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

function StatusBadge({
  moderationStatus,
  isDeleted,
}: {
  moderationStatus: AdminPostRow["moderationStatus"]
  isDeleted: boolean
}) {
  if (isDeleted) return <Badge variant="secondary">Deleted</Badge>
  if (moderationStatus === "needs_fix") return <Badge variant="destructive">Needs fix</Badge>
  if (moderationStatus === "hidden") return <Badge variant="secondary">Hidden</Badge>
  return <Badge variant="outline">OK</Badge>
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

export default function AdminPostsPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const page = Number(sp.get("page") ?? "1") || 1
  const limit = Number(sp.get("limit") ?? "20") || 20
  const status = (sp.get("status") ?? "all") as "all" | "ok" | "needs_fix" | "hidden" | "deleted"
  const q = sp.get("q") ?? ""

  const [data, setData] = useState<ListResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // local input with debounce -> updates URL (source of truth)
  const [queryInput, setQueryInput] = useState(q)
  useEffect(() => setQueryInput(q), [q])

  useEffect(() => {
    const t = setTimeout(() => {
      if (queryInput === q) return
      const next = new URLSearchParams(sp.toString())
      if (queryInput.trim()) next.set("q", queryInput.trim())
      else next.delete("q")
      next.set("page", "1")
      router.replace(`/admin/posts?${next.toString()}`)
    }, 350)
    return () => clearTimeout(t)
  }, [queryInput, q, sp, router])

  async function load() {
    setLoading(true)
    setErr(null)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(limit))
      if (q.trim()) params.set("q", q.trim())
      if (status) params.set("status", status)

      const res = await fetch(`/api/admin/posts?${params.toString()}`, { cache: "no-store" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error ?? `Request failed (${res.status})`)
      }
      const json = (await res.json()) as ListResp
      setData(json)
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, q])

  function setParam(updates: Record<string, string | null>) {
    const next = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) next.delete(k)
      else next.set(k, v)
    }
    router.replace(`/admin/posts?${next.toString()}`)
  }

  async function act(postId: string, action: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert(j?.error ?? "Action failed")
        return
      }
      await load()
    })
  }

  const rows = data?.items ?? []
  const total = data?.total ?? 0
  const hasMore = data?.hasMore ?? false

  const pageLabel = useMemo(() => {
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)
    return `Showing ${from}-${to} of ${total}`
  }, [page, limit, total])

  return (
    <>
      <div className="mx-auto w-full max-w-3xl pb-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Admin · Posts</h1>
            <p className="text-sm text-muted-foreground">
              Moderate posts: hide, mark as needs-fix, or soft-delete.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/reports">Reports</Link>
            </Button>
            <Button asChild>
              <Link href="/posts">View site</Link>
            </Button>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Filters */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="sm:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Search</CardTitle>
              <CardDescription>Find posts by title, author, or id.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Search… (e.g. 'Expense', user id, post id)"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filters</CardTitle>
              <CardDescription>Status and quick scopes.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                variant={status === "all" ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setParam({ status: "all", page: "1" })}
              >
                <Filter className="h-4 w-4" />
                All
              </Button>

              <Button
                variant={status === "needs_fix" ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setParam({ status: "needs_fix", page: "1" })}
              >
                <ShieldAlert className="h-4 w-4" />
                Needs fix
              </Button>

              {/* <Button
                variant={status === "hidden" ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setParam({ status: "hidden", page: "1" })}
              >
                <EyeOff className="h-4 w-4" />
                Hidden
              </Button> */}

              <Button
                variant={status === "deleted" ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setParam({ status: "deleted", page: "1" })}
              >
                <Trash2 className="h-4 w-4" />
                Deleted
              </Button>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        {/* Table */}
        <Card>
          <CardContent className="overflow-x-auto">
            {err ? (
              <div className="rounded-md border p-4 text-sm">
                <div className="font-medium">Failed to load</div>
                <div className="mt-1 text-muted-foreground">{err}</div>
              </div>
            ) : null}

            {loading ? (
              <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Post</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead className="text-right">Reports</TableHead>
                    <TableHead className="text-right">Likes</TableHead>
                    <TableHead className="text-right">Comments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="min-w-[360px]">
                        <div className="space-y-1">
                          <div className="font-medium">
                            <Link
                              href={`/admin/posts/${p.id}`}
                              className="hover:underline underline-offset-4"
                            >
                              {p.title}
                            </Link>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-mono">{p.id}</span>
                            <br />
                            <span>{fmtDate(p.createdAt)}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {p.tags.slice(0, 3).map((t) => (
                              <Badge key={t} variant="secondary">
                                {t}
                              </Badge>
                            ))}
                            {p.tags.length > 3 && (
                              <Badge variant="outline">+{p.tags.length - 3}</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <StatusBadge moderationStatus={p.moderationStatus} isDeleted={p.isDeleted} />
                      </TableCell>

                      <TableCell className="min-w-[80px]">
                        <Link
                          href={`/admin/users/${p.author.id}`}
                          className="hover:underline underline-offset-4"
                        >
                          {p.author.name}
                        </Link>
                        {p.author.isVerified && (
                          <div className="mt-1 text-xs text-muted-foreground">Verified</div>
                        )}
                      </TableCell>

                      <TableCell className="text-right">{p.reportsCount}</TableCell>
                      <TableCell className="text-right">{p.likesCount}</TableCell>
                      <TableCell className="text-right">{p.commentsCount}</TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/posts/show/${p.id}`} target="_blank" className="gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Site
                            </Link>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2" disabled={pending}>
                                Actions{" "}
                                {pending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/posts/${p.id}`}>Open moderation</Link>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem onClick={() => act(p.id, "mark_ok")}>
                                Mark OK
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => act(p.id, "mark_needs_fix")}>
                                Mark Needs Fix
                              </DropdownMenuItem>
                              {/* <DropdownMenuItem onClick={() => act(p.id, "hide")}>
                                Hide
                              </DropdownMenuItem> */}

                              <DropdownMenuSeparator />

                              {!p.isDeleted ? (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => act(p.id, "soft_delete")}
                                >
                                  Soft delete
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => act(p.id, "restore")}>
                                  Restore
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!rows.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        No posts found.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{pageLabel}</div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={page <= 1 || loading || pending}
                onClick={() => setParam({ page: String(page - 1) })}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                disabled={!hasMore || loading || pending}
                onClick={() => setParam({ page: String(page + 1) })}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
