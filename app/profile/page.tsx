import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bookmark, ExternalLink, LogOut, Plus, Settings, ShieldCheck } from "lucide-react"

type MyUser = {
  id: string
  name: string
  email: string
  image?: string
  role: "user" | "moderator" | "admin"
  isVerified: boolean
  joinedAt: string
}

type MyPost = {
  id: string
  title: string
  excerpt: string
  createdAt: string
  tags: string[]
  status?: "active" | "inactive" | "archived"
  moderationStatus?: "ok" | "needs_fix" | "hidden"
  counts: {
    likes: number
    comments: number
    saves: number
  }
}

const MOCK_MY_POSTS: MyPost[] = [
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
    id: "p_2",
    title: "Expense Splitter App (Alpha)",
    excerpt:
      "Need 20 testers to validate multi-currency calculations. Join group then install. Please report any rounding issues.",
    createdAt: "1d ago",
    tags: ["Finance", "Tools"],
    moderationStatus: "needs_fix",
    counts: { likes: 9, comments: 2, saves: 3 },
  },
]

const MOCK_ACTIVITY = [
  { id: "a1", label: "You saved “AR Measure (Beta)”", time: "3d ago", href: "/posts/p_3" },
  { id: "a2", label: "You commented on “Expense Splitter App (Alpha)”", time: "5d ago", href: "/posts/p_2" },
  { id: "a3", label: "You posted “Habit Tracker (Invite-only testing)”", time: "1w ago", href: "/posts/p_1" },
]

function RoleBadge({ role }: { role: MyUser["role"] }) {
  if (role === "admin") return <Badge>Admin</Badge>
  if (role === "moderator") return <Badge variant="secondary">Moderator</Badge>
  return <Badge variant="outline">User</Badge>
}

export default async function MyProfilePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin?redirect=/profile")
  }

  // For now, use auth metadata. In a real app, join with "profiles" table.
  const me: MyUser = {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
    email: user.email || "",
    image: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    role: "user", // fallback
    isVerified: false, // fallback
    joinedAt: new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  }

  const myPosts = MOCK_MY_POSTS

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={me.image} alt={me.name} />
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
            <Link href="/posts/new">
              <Plus className="h-4 w-4" />
              New post
            </Link>
          </Button>

          <Button variant="outline" asChild className="gap-2">
            <Link href="/posts/saved">
              <Bookmark className="h-4 w-4" />
              Saved
            </Link>
          </Button>

          <Button variant="outline" asChild className="gap-2">
            <Link href="/verify">
              <ShieldCheck className="h-4 w-4" />
              Verification
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

      {/* Content */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:w-[420px]">
          <TabsTrigger value="posts">My posts</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* My posts */}
        <TabsContent value="posts" className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Your posts</h2>
              <p className="text-sm text-muted-foreground">
                Manage your posts. If a post is marked “Needs fix”, update it to avoid being hidden.
              </p>
            </div>

            <div className="flex gap-2">
              <Input placeholder="Search your posts…" className="sm:w-[280px]" />
              <Button variant="outline" asChild>
                <Link href="/posts">Browse all</Link>
              </Button>
            </div>
          </div>

          {myPosts.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">No posts yet</CardTitle>
                <CardDescription>Create your first post and start collecting testers.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link href="/posts/new">Create post</Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            myPosts.map((p) => (
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
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/posts/edit/${p.id}`}>Edit</Link>
                      </Button>
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
                  <Button variant="ghost" size="sm" asChild className="gap-2">
                    <Link href={`/posts/${p.id}`}>
                      View <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Recent activity</h2>
            <p className="text-sm text-muted-foreground">A quick log of your recent actions.</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {MOCK_ACTIVITY.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-4">
                    <Link href={a.href} className="text-sm hover:underline underline-offset-4">
                      {a.label}
                    </Link>
                    <div className="text-xs text-muted-foreground">{a.time}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="text-sm text-muted-foreground">
              UI-only for now. Later you can add profile edits, notification settings, etc.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account</CardTitle>
                <CardDescription>Basic account actions.</CardDescription>
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
                  Preferences UI can live here later (dark mode is already handled globally by your theme).
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
