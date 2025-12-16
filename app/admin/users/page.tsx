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
import { ChevronDown, Search, ShieldCheck, UserCog, Loader2 } from "lucide-react"

type AdminUserRow = {
  id: string
  name: string
  email: string
  role: "user" | "moderator" | "admin"
  isVerified: boolean
  createdAt: string
  postsCount: number
  reportsCount: number
}

type UsersResponse = {
  items: AdminUserRow[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

function RoleBadge({ role }: { role: AdminUserRow["role"] }) {
  if (role === "admin") return <Badge>Admin</Badge>
  if (role === "moderator") return <Badge variant="secondary">Moderator</Badge>
  return <Badge variant="outline">User</Badge>
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
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

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("")
  const qDebounced = useDebouncedValue(q, 300)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const [loading, setLoading] = useState(true)
  const [mutatingId, setMutatingId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [data, setData] = useState<UsersResponse>({
    items: [],
    page: 1,
    limit,
    total: 0,
    hasMore: false,
  })

  const qs = useMemo(() => {
    const sp = new URLSearchParams()
    sp.set("page", String(page))
    sp.set("limit", String(limit))
    if (qDebounced.trim()) sp.set("q", qDebounced.trim())
    return sp.toString()
  }, [page, limit, qDebounced])

  async function reload() {
    setLoading(true)
    setErr(null)
    const r = await fetchJson<UsersResponse>(`/api/admin/users?${qs}`)
    if (!r.ok) {
      setErr(r.error)
      setData((d) => ({ ...d, items: [], total: 0, hasMore: false }))
      setLoading(false)
      return
    }
    setData(r.data)
    setLoading(false)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs])

  async function patchUser(id: string, patch: Partial<Pick<AdminUserRow, "role" | "isVerified" | "name">>) {
    setMutatingId(id)
    setErr(null)

    const r = await fetchJson<{ ok: true }>(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })

    setMutatingId(null)

    if (!r.ok) {
      setErr(r.error)
      return
    }

    // refresh list (role/verify displayed)
    reload()
  }

  const rows = data.items

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin · Users</h1>
          <p className="text-sm text-muted-foreground">Manage roles and verification state.</p>
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

      {err && (
        <Card className="mb-6 border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">Error</CardTitle>
            <CardDescription>{err}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search</CardTitle>
          <CardDescription>Search by name, email, or id.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search… (e.g. Nadia, spam@, 8b2b...)"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Users</CardTitle>
          <CardDescription>Promotions should be rare. Use user detail for more control.</CardDescription>
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
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Posts</TableHead>
                  <TableHead className="text-right">Reports</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((u) => {
                  const busy = mutatingId === u.id
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="min-w-[320px]">
                        <div className="space-y-1">
                          <div className="font-medium">
                            <Link href={`/admin/users/${u.id}`} className="hover:underline underline-offset-4">
                              {u.name}
                            </Link>
                          </div>
                          <div className="text-sm text-muted-foreground">{u.email}</div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-mono">{u.id}</span> • Joined{" "}
                            {new Date(u.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>

                      <TableCell>
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-2 text-sm">
                            <ShieldCheck className="h-4 w-4" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">{u.postsCount}</TableCell>
                      <TableCell className="text-right">{u.reportsCount}</TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/users/${u.id}`}>Open</Link>
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
                                <Link href={`/admin/users/${u.id}`} className="gap-2">
                                  <UserCog className="h-4 w-4" />
                                  Manage
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem disabled={busy} onClick={() => patchUser(u.id, { role: "moderator" })}>
                                Promote to moderator
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={busy} onClick={() => patchUser(u.id, { role: "user" })}>
                                Demote to user
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={busy} onClick={() => patchUser(u.id, { role: "admin" })}>
                                Promote to admin
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem disabled={busy} onClick={() => patchUser(u.id, { isVerified: true })}>
                                Force verify
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={busy} onClick={() => patchUser(u.id, { isVerified: false })}>
                                Remove verification
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
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {rows.length} users • total {data.total}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" disabled={loading || !data.hasMore} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
