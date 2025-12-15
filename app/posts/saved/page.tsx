import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Bookmark, Heart, MessageSquare, Search, ShieldCheck, Trash2 } from "lucide-react"

type SavedPost = {
  id: string
  title: string
  excerpt: string
  tags: string[]
  createdAt: string
  author: {
    id: string
    name: string
    isVerified?: boolean
  }
  counts: {
    likes: number
    comments: number
    saves: number
  }
}

const MOCK_SAVED: SavedPost[] = [
  {
    id: "p_3",
    title: "AR Measure (Beta)",
    excerpt:
      "Testing AR stability on low-end devices. Join group and install. Please share device model + Android version.",
    tags: ["Tools", "Education"],
    createdAt: "3d ago",
    author: { id: "u_3", name: "Nadia", isVerified: true },
    counts: { likes: 57, comments: 14, saves: 21 },
  },
  {
    id: "p_1",
    title: "Habit Tracker (Invite-only testing)",
    excerpt:
      "Looking for testers. Please join the Google Group first, then install from Play Store. Any feedback on notifications is welcome.",
    tags: ["Productivity", "Health"],
    createdAt: "2h ago",
    author: { id: "u_1", name: "Aimen", isVerified: true },
    counts: { likes: 31, comments: 8, saves: 12 },
  },
]

export default function SavedPostsPage() {
  const items = MOCK_SAVED // UI-only mock

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Saved posts</h1>
          <p className="text-sm text-muted-foreground">
            Your personal list. Come back later to test or leave feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/posts">Back to posts</Link>
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Search (UI only) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search saved posts…" />
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            {items.length} saved
          </span>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Empty state */}
      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nothing saved yet</CardTitle>
            <CardDescription>
              Save posts from the feed to keep track of apps you want to test later.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/posts">Browse posts</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((post) => (
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
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Bookmark className="h-4 w-4" />
                      Saved
                    </Button>

                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Remove
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
                <p className="text-sm leading-relaxed text-foreground/90">{post.excerpt}</p>
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

                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/posts/${post.id}`}>View details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination UI (optional) */}
      <div className="mt-8 flex items-center justify-between">
        <Button variant="outline" disabled>
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">Page 1 of 1</div>
        <Button variant="outline" disabled>
          Next
        </Button>
      </div>
    </div>
  )
}
