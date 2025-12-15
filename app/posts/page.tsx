import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ChevronDown, Heart, MessageSquare, Bookmark, ShieldCheck } from "lucide-react"

type FeedPost = {
  id: string
  title: string
  content: string
  playStoreUrl: string
  googleGroupUrl: string
  tags: string[]
  createdAt: string
  author: {
    id: string
    name: string
    image?: string
    isVerified?: boolean
  }
  counts: {
    likes: number
    comments: number
    saves: number
  }
  moderationStatus?: "ok" | "needs_fix" | "hidden"
}

const MOCK_TAGS = ["Tools", "Finance", "AI", "Health", "Games", "Productivity", "Education"]

const MOCK_POSTS: FeedPost[] = [
  {
    id: "p_1",
    title: "Habit Tracker (Invite-only testing)",
    content:
      "Looking for testers. Please join the Google Group first, then install from Play Store. Any feedback on notifications is welcome.",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.example.habit",
    googleGroupUrl: "https://groups.google.com/g/example-testers",
    tags: ["Productivity", "Health"],
    createdAt: "2h ago",
    author: { id: "u_1", name: "Aimen", isVerified: true },
    counts: { likes: 31, comments: 8, saves: 12 },
    moderationStatus: "ok",
  },
  {
    id: "p_2",
    title: "Expense Splitter App (Alpha)",
    content:
      "Need 20 testers to validate multi-currency calculations. Join group then install. Please report any rounding issues.",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.example.split",
    googleGroupUrl: "https://groups.google.com/g/split-alpha-testers",
    tags: ["Finance", "Tools"],
    createdAt: "1d ago",
    author: { id: "u_2", name: "Samir", isVerified: false },
    counts: { likes: 9, comments: 2, saves: 3 },
    moderationStatus: "needs_fix",
  },
  {
    id: "p_3",
    title: "AR Measure (Beta)",
    content:
      "Testing AR stability on low-end devices. Join group and install. Please share device model + Android version.",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.example.armeasure",
    googleGroupUrl: "https://groups.google.com/g/ar-measure-beta",
    tags: ["Tools", "Education"],
    createdAt: "3d ago",
    author: { id: "u_3", name: "Nadia", isVerified: true },
    counts: { likes: 57, comments: 14, saves: 21 },
    moderationStatus: "ok",
  },
]

export default function PostsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
          <p className="text-sm text-muted-foreground">
            Join the Google Group first, then install the Play Store link as an invited tester.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/posts/new">New post</Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/posts/saved">Saved</Link>
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Input placeholder="Search posts…" className="max-w-xl" />
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Sort <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Newest</DropdownMenuItem>
                <DropdownMenuItem>Most liked</DropdownMenuItem>
                <DropdownMenuItem>Most saved</DropdownMenuItem>
                <DropdownMenuItem>Most commented</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Switch id="verified-only" />
              <Label htmlFor="verified-only" className="text-sm">
                Verified only
              </Label>
            </div>
          </div>
        </div>

        {/* Tag chips */}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" className="rounded-full">
            All
          </Button>

          {MOCK_TAGS.map((t) => (
            <Button key={t} variant="outline" size="sm" className="rounded-full">
              {t}
            </Button>
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Feed */}
      <div className="space-y-4">
        {MOCK_POSTS.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <CardHeader className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    <Link
                      href={`/posts/${post.id}`}
                      className="hover:underline underline-offset-4"
                    >
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2">
                    <span>
                      by{" "}
                      <Link
                        href={`/users/${post.author.id}`}
                        className="font-medium text-foreground hover:underline underline-offset-4"
                      >
                        {post.author.name}
                      </Link>
                    </span>
                    {post.author.isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs text-foreground">
                        <ShieldCheck className="h-4 w-4" />
                        Verified
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">• {post.createdAt}</span>

                    {post.moderationStatus === "needs_fix" && (
                      <Badge variant="destructive" className="ml-1">
                        Needs fix
                      </Badge>
                    )}
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Bookmark className="h-4 w-4" />
                    Save
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/posts/${post.id}`}>Open</Link>
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/90">{post.content}</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Play Store</div>
                  <div className="truncate text-sm font-medium">{post.playStoreUrl}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Google Group</div>
                  <div className="truncate text-sm font-medium">{post.googleGroupUrl}</div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-4 w-4" /> {post.counts.likes}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" /> {post.counts.comments}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bookmark className="h-4 w-4" /> {post.counts.saves}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/posts/${post.id}`}>View details</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Pagination (UI only) */}
      <div className="mt-8 flex items-center justify-between">
        <Button variant="outline" disabled>
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">Page 1 of 12</div>
        <Button variant="outline">Next</Button>
      </div>
    </div>
  )
}
