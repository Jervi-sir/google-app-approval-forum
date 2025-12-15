import Link from "next/link"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ExternalLink, Flag, Heart, Bookmark, MessageSquare, ShieldCheck } from "lucide-react"

type PostDetail = {
  id: string
  title: string
  content: string
  playStoreUrl: string
  googleGroupUrl: string
  tags: string[]
  createdAt: string
  moderationStatus?: "ok" | "needs_fix" | "hidden"
  author: {
    id: string
    name: string
    image?: string
    isVerified?: boolean
  }
  counts: {
    likes: number
    saves: number
    comments: number
  }
}

type CommentItem = {
  id: string
  author: {
    id: string
    name: string
    image?: string
    isVerified?: boolean
  }
  createdAt: string
  content: string
}

const MOCK_POSTS: Record<string, PostDetail> = {
  p_1: {
    id: "p_1",
    title: "Habit Tracker (Invite-only testing)",
    content:
      "Looking for testers. Please join the Google Group first, then install from Play Store. Any feedback on notifications is welcome.\n\nIf you can, please test on Android 11+ and report battery usage issues.",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.example.habit",
    googleGroupUrl: "https://groups.google.com/g/example-testers",
    tags: ["Productivity", "Health"],
    createdAt: "2h ago",
    moderationStatus: "ok",
    author: { id: "u_1", name: "Aimen", isVerified: true },
    counts: { likes: 31, saves: 12, comments: 8 },
  },
  p_2: {
    id: "p_2",
    title: "Expense Splitter App (Alpha)",
    content:
      "Need 20 testers to validate multi-currency calculations. Join group then install.\n\nPlease report any rounding issues and screenshots if possible.",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.example.split",
    googleGroupUrl: "https://groups.google.com/g/split-alpha-testers",
    tags: ["Finance", "Tools"],
    createdAt: "1d ago",
    moderationStatus: "needs_fix",
    author: { id: "u_2", name: "Samir", isVerified: false },
    counts: { likes: 9, saves: 3, comments: 2 },
  },
}

const MOCK_COMMENTS: Record<string, CommentItem[]> = {
  p_1: [
    {
      id: "c_1",
      author: { id: "u_9", name: "Nadia", isVerified: true },
      createdAt: "1h ago",
      content: "Installed ✅ Notifications are okay. Battery seems fine on Pixel 6. I’ll test background sync later.",
    },
    {
      id: "c_2",
      author: { id: "u_8", name: "Karim", isVerified: false },
      createdAt: "45m ago",
      content: "Joined the group but Play Store still says not available. Maybe I need to wait a bit?",
    },
  ],
  p_2: [
    {
      id: "c_3",
      author: { id: "u_7", name: "Salma", isVerified: false },
      createdAt: "20h ago",
      content: "Works well so far. Currency conversion UI could be clearer though.",
    },
  ],
}

function ReportDialog({
  targetLabel,
}: {
  targetLabel: string
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Flag className="h-4 w-4" />
          Report
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report {targetLabel}</DialogTitle>
          <DialogDescription>
            Help us keep the community clean. Pick a reason and add optional details.
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
            <Textarea
              id="report-message"
              placeholder="Add details (optional)…"
              className="min-h-[110px]"
            />
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

export default function PostDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const post = MOCK_POSTS['p_1']
  // if (!post) notFound()

  // UI behavior: hide content if "hidden" (in real app, mods/admin could see it)
  if (post.moderationStatus === "hidden") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This content is unavailable</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This post was hidden by moderation or removed by the author.
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/posts">Back to posts</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const comments = MOCK_COMMENTS[post.id] ?? []

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Top nav */}
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/posts">← Back</Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/posts/edit/${post.id}`}>Edit</Link>
          </Button>
          <ReportDialog targetLabel="post" />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {/* Title + meta */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link
              href={`/users/${post.author.id}`}
              className="inline-flex items-center gap-2 hover:underline underline-offset-4"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={post.author.image} alt={post.author.name} />
                <AvatarFallback>{post.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{post.author.name}</span>
            </Link>

            {post.author.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs text-foreground">
                <ShieldCheck className="h-4 w-4" />
                Verified
              </span>
            )}

            <span className="text-xs">• {post.createdAt}</span>

            {post.moderationStatus === "needs_fix" && (
              <Badge variant="destructive">Needs fix</Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        </div>

        {/* CTA cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 1 — Join Google Group</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Join first so Play Store recognizes you as invited.
              </p>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Google Group URL</div>
                <div className="truncate text-sm font-medium">{post.googleGroupUrl}</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full gap-2">
                <a href={post.googleGroupUrl} target="_blank" rel="noreferrer">
                  Open group <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 2 — Install from Play Store</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                After joining, install from the Play Store listing.
              </p>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Play Store URL</div>
                <div className="truncate text-sm font-medium">{post.playStoreUrl}</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="secondary" className="w-full gap-2">
                <a href={post.playStoreUrl} target="_blank" rel="noreferrer">
                  Open Play Store <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Body */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {post.content}
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Heart className="h-4 w-4" />
              Like <span className="text-muted-foreground">({post.counts.likes})</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Bookmark className="h-4 w-4" />
              Save <span className="text-muted-foreground">({post.counts.saves})</span>
            </Button>
          </div>

          <div className="text-sm text-muted-foreground inline-flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {post.counts.comments} comments
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold">Comments</h2>
              <p className="text-sm text-muted-foreground">
                Be respectful. Report anything suspicious.
              </p>
            </div>
          </div>

          {/* Add comment (UI only) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add a comment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Write your comment…" className="min-h-[110px]" />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Tip: include your device model + Android version for better feedback.
                </p>
                <Button>Post comment</Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Comment list */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                No comments yet. Be the first.
              </div>
            ) : (
              comments.map((c) => (
                <Card key={c.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={c.author.image} alt={c.author.name} />
                          <AvatarFallback>{c.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/users/${c.author.id}`}
                              className="font-medium hover:underline underline-offset-4"
                            >
                              {c.author.name}
                            </Link>
                            {c.author.isVerified && (
                              <span className="inline-flex items-center gap-1 text-xs text-foreground">
                                <ShieldCheck className="h-4 w-4" />
                                Verified
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">• {c.createdAt}</span>
                          </div>

                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                            {c.content}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <ReportDialog targetLabel="comment" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Bottom back */}
        <div className="pt-2">
          <Button asChild variant="outline" className="w-full">
            <Link href="/posts">Back to posts</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
