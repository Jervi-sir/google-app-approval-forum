import Link from "next/link"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, Flag, ShieldCheck } from "lucide-react"

type PublicUser = {
  id: string
  name: string
  image?: string
  isVerified: boolean
  role?: "user" | "moderator" | "admin" // public page: you can hide this later
  joinedAt: string
  bio?: string
  stats: {
    posts: number
    likes: number
    saves: number
  }
}

type UserPost = {
  id: string
  title: string
  excerpt: string
  createdAt: string
  tags: string[]
  moderationStatus?: "ok" | "needs_fix" | "hidden"
  counts: {
    likes: number
    comments: number
    saves: number
  }
}

const MOCK_USERS: Record<string, PublicUser> = {
  u_1: {
    id: "u_1",
    name: "Aimen",
    isVerified: true,
    joinedAt: "Dec 2025",
    bio: "Shipping apps, fintech ideas, and small utility tools. Looking for testers for Android builds.",
    stats: { posts: 5, likes: 128, saves: 46 },
  },
  u_2: {
    id: "u_2",
    name: "Samir",
    isVerified: false,
    joinedAt: "Nov 2025",
    bio: "Building budgeting + expense tracking apps. Please leave feedback with screenshots.",
    stats: { posts: 2, likes: 21, saves: 9 },
  },
}

const MOCK_USER_POSTS: Record<string, UserPost[]> = {
  u_1: [
    {
      id: "p_1",
      title: "Habit Tracker (Invite-only testing)",
      excerpt:
        "Looking for testers. Please join the Google Group first, then install from Play Store. Any feedback on notifications is welcome.",
      createdAt: "2h ago",
      tags: ["Productivity", "Health"],
      moderationStatus: "ok",
      counts: { likes: 31, comments: 8, saves: 12 },
    },
    {
      id: "p_9",
      title: "Lightweight Notes App (Beta)",
      excerpt:
        "Need feedback on sync reliability + offline mode. Please test on low-end devices if possible.",
      createdAt: "5d ago",
      tags: ["Tools", "Productivity"],
      moderationStatus: "ok",
      counts: { likes: 12, comments: 3, saves: 7 },
    },
  ],
  u_2: [
    {
      id: "p_2",
      title: "Expense Splitter App (Alpha)",
      excerpt:
        "Need 20 testers to validate multi-currency calculations. Join group then install. Please report any rounding issues.",
      createdAt: "1d ago",
      tags: ["Finance", "Tools"],
      moderationStatus: "needs_fix",
      counts: { likes: 9, comments: 2, saves: 3 },
    },
  ],
}

function ReportUserDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Flag className="h-4 w-4" />
          Report user
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report user</DialogTitle>
          <DialogDescription>
            Pick a reason and add optional context. Reports are reviewed by moderators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Select reason <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuItem>Spam</DropdownMenuItem>
                <DropdownMenuItem>Malware</DropdownMenuItem>
                <DropdownMenuItem>Hate</DropdownMenuItem>
                <DropdownMenuItem>Harassment</DropdownMenuItem>
                <DropdownMenuItem>Copyright</DropdownMenuItem>
                <DropdownMenuItem>Other</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-message">Message (optional)</Label>
            <Textarea id="report-message" placeholder="Add details (optional)…" className="min-h-[110px]" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Submit report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PublicUserPage({ params }: { params: { id: string } }) {
  const user = MOCK_USERS[params.id]
  if (!user) notFound()

  const posts = MOCK_USER_POSTS[user.id] ?? []

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Top nav */}
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/posts">← Back</Link>
        </Button>

        <div className="flex items-center gap-2">
          <ReportUserDialog />
        </div>
      </div>

      {/* Profile header */}
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
                    {user.role && <Badge variant="secondary">{user.role}</Badge>}
                  </div>

                  <div className="text-xs text-muted-foreground">Joined {user.joinedAt}</div>

                  {user.bio && (
                    <p className="max-w-2xl text-sm text-muted-foreground">{user.bio}</p>
                  )}
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

      {/* Posts list */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Posts by {user.name}</h2>
          <p className="text-sm text-muted-foreground">
            Browse their shared apps. Join group first, then install.
          </p>
        </div>

        <div className="flex gap-2">
          <Input placeholder={`Search ${user.name}'s posts…`} className="sm:w-[280px]" />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">No posts</CardTitle>
              <CardDescription>This user hasn’t posted anything yet.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          posts.map((p) => (
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
                      <span className="text-xs text-muted-foreground">• {p.createdAt}</span>
                      {p.moderationStatus === "needs_fix" && (
                        <Badge variant="destructive">Needs fix</Badge>
                      )}
                      {p.moderationStatus === "hidden" && <Badge variant="secondary">Hidden</Badge>}
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
    </div>
  )
}
