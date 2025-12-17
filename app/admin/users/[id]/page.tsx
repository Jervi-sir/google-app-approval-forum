"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ShieldCheck, UserCog, ExternalLink, Crown, Loader2 } from "lucide-react"

type AdminUserDetail = {
  id: string
  name: string
  email: string
  image?: string | null
  role: "user" | "moderator" | "admin"
  isVerified: boolean
  createdAt: string
  stats: {
    posts: number
    comments: number
    reportsMade: number
    reportsAgainst: number
  }
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

function RoleBadge({ role }: { role: AdminUserDetail["role"] }) {
  if (role === "admin") return <Badge className="gap-1"><Crown className="h-3 w-3" /> Admin</Badge>
  if (role === "moderator") return <Badge variant="secondary">Moderator</Badge>
  return <Badge variant="outline">User</Badge>
}

function ConfirmDialog({
  title,
  description,
  trigger,
  confirmLabel,
  onConfirm,
  disabled,
}: {
  title: string
  description: string
  trigger: React.ReactNode
  confirmLabel: string
  onConfirm: () => void
  disabled?: boolean
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button onClick={onConfirm} disabled={disabled}>
            {disabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id?: string }>()
  const router = useRouter()
  const id = (params?.id ?? "") as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [user, setUser] = useState<AdminUserDetail | null>(null)

  const [nameDraft, setNameDraft] = useState("")

  async function load() {
    setLoading(true)
    setErr(null)

    const r = await fetchJson<AdminUserDetail>(`/api/admin/users/${id}/detail`)
    if (!r.ok) {
      setErr(r.error)
      setUser(null)
      setLoading(false)
      // if (r.status === 401) router.replace("/login")
      // if (r.status === 403) router.replace("/403")
      return
    }

    setUser(r.data)
    setNameDraft(r.data.name)
    setLoading(false)
  }

  useEffect(() => {
    if (!id) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function patch(patch: Partial<Pick<AdminUserDetail, "name" | "role" | "isVerified">>) {
    setSaving(true)
    setErr(null)

    const r = await fetchJson<{ ok: true }>(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })

    setSaving(false)

    if (!r.ok) {
      setErr(r.error)
      return
    }

    await load()
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl pb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl pb-8 space-y-4">
        <Button asChild variant="ghost" onClick={() => window.history.back()}>
          <Link href="">← Back</Link>
        </Button>
        <Card className="border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">User not found / access denied</CardTitle>
            <CardDescription>{err ?? "Unknown error"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const initials = (user.name ?? "U").slice(0, 2).toUpperCase()

  return (
    <div className="mx-auto w-full max-w-3xl py-8">
      {/* Top nav */}
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" onClick={() => window.history.back()}>
          <Link href="">← Back</Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link href={`/users/${user.id}`}>
              <ExternalLink className="h-4 w-4" />
              Public profile
            </Link>
          </Button>
        </div>
      </div>

      {err && (
        <Card className="mt-4 border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">Error</CardTitle>
            <CardDescription>{err}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Header */}
      <div className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback>{initials}</AvatarFallback>
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
                    <RoleBadge role={user.role} />
                  </div>

                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-mono">{user.id}</span> • Joined {new Date(user.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[320px]">
                {[
                  ["Posts", user.stats.posts],
                  ["Comments", user.stats.comments],
                  ["Reports made", user.stats.reportsMade],
                  ["Reports against", user.stats.reportsAgainst],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-md border p-3 text-center">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="text-lg font-semibold">{value as any}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User info</CardTitle>
              <CardDescription>Basic fields.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input value={user.id} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Display name</Label>
                <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => patch({ name: nameDraft })}
                disabled={saving || !nameDraft.trim() || nameDraft.trim() === user.name}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permissions</CardTitle>
              <CardDescription>Role and verification.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Verified</div>
                  <div className="text-xs text-muted-foreground">Show verified badge on posts.</div>
                </div>
                <Switch checked={user.isVerified} onCheckedChange={(v) => patch({ isVerified: v })} disabled={saving} />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium">Role</div>
                <div className="text-xs text-muted-foreground">
                  Admins can do everything. Moderators can handle reports/posts.
                </div>
              </div>

              <div className="grid gap-2">
                <ConfirmDialog
                  title="Promote to moderator?"
                  description="This user will gain access to admin moderation screens."
                  confirmLabel="Promote"
                  disabled={saving}
                  onConfirm={() => patch({ role: "moderator" })}
                  trigger={
                    <Button variant="outline" className="w-full gap-2" disabled={saving}>
                      <UserCog className="h-4 w-4" />
                      Promote to moderator
                    </Button>
                  }
                />

                <ConfirmDialog
                  title="Demote to user?"
                  description="This user will lose moderator/admin access."
                  confirmLabel="Demote"
                  disabled={saving}
                  onConfirm={() => patch({ role: "user" })}
                  trigger={
                    <Button variant="outline" className="w-full" disabled={saving}>
                      Demote to user
                    </Button>
                  }
                />

                <ConfirmDialog
                  title="Promote to admin?"
                  description="Use with extreme caution."
                  confirmLabel="Make admin"
                  disabled={saving}
                  onConfirm={() => patch({ role: "admin" })}
                  trigger={
                    <Button className="w-full gap-2" disabled={saving}>
                      <Crown className="h-4 w-4" />
                      Promote to admin
                    </Button>
                  }
                />
              </div>
            </CardContent>

            <CardFooter className="text-xs text-muted-foreground">
              Note: only admins can change roles (API enforces it).
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
