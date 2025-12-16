"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, ExternalLink, Flag, Filter, Search, ShieldAlert, CheckCircle2, XCircle, Loader2 } from "lucide-react"

type ReportRow = {
  id: string
  createdAt: string
  status: "open" | "reviewing" | "resolved" | "rejected"
  reason: "spam" | "malware" | "hate" | "harassment" | "copyright" | "other"
  targetType: "post" | "comment" | "user"
  targetId: string
  reporter: { id: string; name: string }
  summary?: string | null
}

type ReportsResponse = {
  items: ReportRow[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

function StatusBadge({ status }: { status: ReportRow["status"] }) {
  if (status === "open") return <Badge variant="destructive">Open</Badge>
  if (status === "reviewing") return <Badge variant="secondary">Reviewing</Badge>
  if (status === "resolved") return <Badge>Resolved</Badge>
  return <Badge variant="outline">Rejected</Badge>
}

function ReasonBadge({ reason }: { reason: ReportRow["reason"] }) {
  if (reason === "malware") return <Badge variant="destructive">Malware</Badge>
  if (reason === "spam") return <Badge variant="secondary">Spam</Badge>
  return <Badge variant="outline">{reason}</Badge>
}

function TargetBadge({ t }: { t: ReportRow["targetType"] }) {
  return <Badge variant="outline">{t === "post" ? "Post" : t === "comment" ? "Comment" : "User"}</Badge>
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const res = await fetch(url, { ...init, credentials: "include", cache: "no-store" })
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

export default function AdminReportsPage() {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<ReportRow["status"] | "all">("all")
  const [reason, setReason] = useState<ReportRow["reason"] | "all">("all")
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const [loading, setLoading] = useState(true)
  const [mutatingId, setMutatingId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [data, setData] = useState<ReportsResponse>({
    items: [],
    page: 1,
    limit,
    total: 0,
    hasMore: false,
  })

  // debounce search
  const qDebounced = useDebouncedValue(q, 350)

  const queryString = useMemo(() => {
    const sp = new URLSearchParams()
    sp.set("page", String(page))
    sp.set("limit", String(limit))
    if (qDebounced.trim()) sp.set("q", qDebounced.trim())
    if (status !== "all") sp.set("status", status)
    if (reason !== "all") sp.set("reason", reason)
    return sp.toString()
  }, [page, limit, qDebounced, status, reason])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setErr(null)

    fetchJson<ReportsResponse>(`/api/admin/reports?${queryString}`)
      .then((r) => {
        if (!alive) return
        if (!r.ok) {
          setErr(r.error)
          setData((d) => ({ ...d, items: [], total: 0, hasMore: false }))
          return
        }
        setData(r.data)
      })
      .finally(() => {
        if (!alive) return
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [queryString])

  // quick filters
  const setQuickAll = () => {
    setStatus("all")
    setReason("all")
    setPage(1)
  }
  const setQuickOpen = () => {
    setStatus("open")
    setReason("all")
    setPage(1)
  }
  const setQuickMalware = () => {
    setStatus("all")
    setReason("malware")
    setPage(1)
  }

  async function updateStatus(reportId: string, next: ReportRow["status"]) {
    setMutatingId(reportId)
    setErr(null)

    const r = await fetchJson<{ ok: true }>(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })

    setMutatingId(null)

    if (!r.ok) {
      setErr(r.error)
      return
    }

    // optimistic local update
    setData((prev) => ({
      ...prev,
      items: prev.items.map((x) => (x.id === reportId ? { ...x, status: next } : x)),
    }))
  }

  const rows = data.items

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin · Reports</h1>
          <p className="text-sm text-muted-foreground">Review abuse reports and take moderation actions.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/posts">Posts</Link>
          </Button>
          <Button asChild>
            <Link href="/posts">View site</Link>
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {err && (
        <Card className="mb-6 border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">Error</CardTitle>
            <CardDescription>{err}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="sm:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Search</CardTitle>
            <CardDescription>Search by report id, reporter, or target id.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search… (e.g. r_1001, p_4, Nadia)"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick filters</CardTitle>
            <CardDescription>Status / high-priority types.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={setQuickAll}>
              <Filter className="h-4 w-4" />
              All
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={setQuickOpen}>
              <Flag className="h-4 w-4" />
              Open
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={setQuickMalware}>
              <ShieldAlert className="h-4 w-4" />
              Malware
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Incoming reports</CardTitle>
          <CardDescription>Prioritize malware reports first. Open each target on site before resolving.</CardDescription>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((r) => {
                  const targetHref =
                    r.targetType === "post"
                      ? `/posts/${r.targetId}`
                      : r.targetType === "user"
                        ? `/users/${r.targetId}`
                        : "#"

                  const adminTargetHref =
                    r.targetType === "post"
                      ? `/admin/posts/${r.targetId}`
                      : r.targetType === "user"
                        ? `/admin/users/${r.targetId}`
                        : "#"

                  const busy = mutatingId === r.id

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="min-w-[320px]">
                        <div className="space-y-1">
                          <div className="font-medium">
                            <span className="font-mono">{r.id}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(r.createdAt).toLocaleString()} • target{" "}
                            <span className="font-mono">{r.targetId}</span>
                          </div>
                          {r.summary && (
                            <div className="text-sm text-muted-foreground line-clamp-2">{r.summary}</div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>

                      <TableCell>
                        <ReasonBadge reason={r.reason} />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TargetBadge t={r.targetType} />
                          <span className="font-mono text-xs text-muted-foreground">{r.targetId}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Link href={`/admin/users/${r.reporter.id}`} className="hover:underline underline-offset-4">
                          {r.reporter.name}
                        </Link>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={targetHref} className="gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Site
                            </Link>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2" disabled={busy}>
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Actions <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={adminTargetHref}>Open target moderation</Link>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => updateStatus(r.id, "reviewing")}
                                disabled={busy}
                              >
                                <Flag className="h-4 w-4" />
                                Mark reviewing
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => updateStatus(r.id, "resolved")}
                                disabled={busy}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Resolve
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => updateStatus(r.id, "rejected")}
                                disabled={busy}
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No reports found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {rows.length} reports • total {data.total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={loading || !data.hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}
