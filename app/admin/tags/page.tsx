"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, Trash2, Loader2, Pencil } from "lucide-react"

type TagRow = {
  id: string
  name: string
  slug: string
  postsCount: number
  createdAt: string
}

type TagsResponse = {
  items: TagRow[]
  page: number
  limit: number
  total: number
  hasMore: boolean
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

function CreateTagDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit() {
    setLoading(true)
    setErr(null)
    const r = await fetchJson<{ ok: true }>(`/api/admin/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slug || undefined }),
    })
    setLoading(false)

    if (!r.ok) {
      setErr(r.error)
      return
    }

    setOpen(false)
    setName("")
    setSlug("")
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New tag
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create tag</DialogTitle>
          <DialogDescription>Tags help users discover posts. Keep them short and clear.</DialogDescription>
        </DialogHeader>

        {err && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {err}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Name</Label>
            <Input
              id="tag-name"
              placeholder="e.g. Productivity"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-slug">Slug</Label>
            <Input
              id="tag-slug"
              placeholder="e.g. productivity"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Lowercase, no spaces. If empty, we auto-generate.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading || !name.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminTagsPage() {
  const [q, setQ] = useState("")
  const qDebounced = useDebouncedValue(q, 300)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [mutatingId, setMutatingId] = useState<string | null>(null)

  const [data, setData] = useState<TagsResponse>({
    items: [],
    page: 1,
    limit,
    total: 0,
    hasMore: false,
  })

  const queryString = useMemo(() => {
    const sp = new URLSearchParams()
    sp.set("page", String(page))
    sp.set("limit", String(limit))
    if (qDebounced.trim()) sp.set("q", qDebounced.trim())
    return sp.toString()
  }, [page, limit, qDebounced])

  async function reload() {
    setLoading(true)
    setErr(null)
    const r = await fetchJson<TagsResponse>(`/api/admin/tags?${queryString}`)
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
  }, [queryString])

  async function deleteTag(id: string) {
    setMutatingId(id)
    setErr(null)

    const r = await fetchJson<{ ok: true }>(`/api/admin/tags/${id}`, { method: "DELETE" })

    setMutatingId(null)

    if (!r.ok) {
      setErr(r.error)
      return
    }

    // refresh after delete (counts/total)
    reload()
  }

  const tags = data.items

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin · Tags</h1>
          <p className="text-sm text-muted-foreground">Manage tags used for filtering and discovery.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/posts">Posts</Link>
          </Button>
          <CreateTagDialog onCreated={() => reload()} />
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
          <CardDescription>Find tags by name or slug.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search… (e.g. tools, finance)"
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
          <CardTitle className="text-base">Tags</CardTitle>
          <CardDescription>You can delete unused tags to keep the UI clean.</CardDescription>
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
                  <TableHead>Tag</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Posts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {tags.map((t) => {
                  const busy = mutatingId === t.id
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="min-w-[240px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{t.name}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Created {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">{t.id}</div>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-sm">{t.slug}</TableCell>

                      <TableCell className="text-right">{t.postsCount}</TableCell>

                      <TableCell className="flex items-center justify-end gap-2 text-right">
                        <EditTagDialog tag={t} onUpdated={() => reload()} />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                          onClick={() => deleteTag(t.id)}
                          disabled={busy}
                        >
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {!tags.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                      No tags found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {tags.length} tags • total {data.total}
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


function EditTagDialog({
  tag,
  onUpdated,
}: {
  tag: TagRow
  onUpdated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(tag.name)
  const [slug, setSlug] = useState(tag.slug)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(tag.name)
    setSlug(tag.slug)
    setErr(null)
  }, [open, tag.name, tag.slug])

  async function submit() {
    setLoading(true)
    setErr(null)

    const res = await fetch(`/api/admin/tags/${tag.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    })

    if (!res.ok) {
      let msg = `Request failed (${res.status})`
      try {
        const j = await res.json()
        msg = j?.error ? String(j.error) : msg
      } catch { }
      setErr(msg)
      setLoading(false)
      return
    }

    setLoading(false)
    setOpen(false)
    onUpdated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit tag</DialogTitle>
          <DialogDescription>Update tag name/slug. Slug must be unique.</DialogDescription>
        </DialogHeader>

        {err && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {err}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            <p className="text-xs text-muted-foreground">Lowercase, no spaces. If duplicate, you’ll get 409.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading || !name.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
