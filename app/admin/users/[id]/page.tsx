import Link from "next/link"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ShieldCheck, UserCog, ExternalLink, Crown } from "lucide-react"

type AdminUserDetail = {
  id: string
  name: string
  email: string
  image?: string
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

const MOCK: Record<string, AdminUserDetail> = {
  u_2: {
    id: "u_2",
    name: "Samir",
    email: "samir@example.com",
    role: "user",
    isVerified: false,
    createdAt: "Nov 2025",
    stats: { posts: 2, comments: 6, reportsMade: 1, reportsAgainst: 2 },
  },
  u_3: {
    id: "u_3",
    name: "Nadia",
    email: "nadia@example.com",
    role: "moderator",
    isVerified: true,
    createdAt: "Nov 2025",
    stats: { posts: 3, comments: 14, reportsMade: 4, reportsAgainst: 0 },
  },
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
}: {
  title: string
  description: string
  trigger: React.ReactNode
  confirmLabel: string
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
          <Button>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const user = MOCK[params.id]
  if (!user) notFound()

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Top nav */}
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/admin/users">← Back</Link>
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

      {/* Header */}
      <div className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={user.image} alt={user.name} />
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
                    <RoleBadge role={user.role} />
                  </div>

                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-mono">{user.id}</span> • Joined {user.createdAt}
                  </div>
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[320px]">
                <div className="rounded-md border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Posts</div>
                  <div className="text-lg font-semibold">{user.stats.posts}</div>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Comments</div>
                  <div className="text-lg font-semibold">{user.stats.comments}</div>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Reports made</div>
                  <div className="text-lg font-semibold">{user.stats.reportsMade}</div>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Reports against</div>
                  <div className="text-lg font-semibold">{user.stats.reportsAgainst}</div>
                </div>
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
              <CardDescription>Basic fields (UI only).</CardDescription>
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
                <Input defaultValue={user.name} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">Save changes</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Admin notes</CardTitle>
              <CardDescription>
                Private moderation notes about this user. (UI only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Short note…" />
              <div className="text-xs text-muted-foreground">
                Example: “Multiple reports for suspicious links. Monitor next posts.”
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">Save note</Button>
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
                <Switch checked={user.isVerified} />
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
                  trigger={
                    <Button variant="outline" className="w-full gap-2">
                      <UserCog className="h-4 w-4" />
                      Promote to moderator
                    </Button>
                  }
                />

                <ConfirmDialog
                  title="Demote to user?"
                  description="This user will lose moderator/admin access."
                  confirmLabel="Demote"
                  trigger={
                    <Button variant="outline" className="w-full">
                      Demote to user
                    </Button>
                  }
                />

                <ConfirmDialog
                  title="Promote to admin?"
                  description="Use with extreme caution."
                  confirmLabel="Make admin"
                  trigger={
                    <Button className="w-full gap-2">
                      <Crown className="h-4 w-4" />
                      Promote to admin
                    </Button>
                  }
                />
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              All actions are UI-only for now.
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
