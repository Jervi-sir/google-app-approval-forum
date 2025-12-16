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
import { headers } from "next/headers"
import { UserNav } from "@/components/user-nav"
import { FeedPost } from "@/utils/types"
import { PostCard } from "@/components/post-card"


type ApiResp = {
  ok: boolean
  page: number
  pageSize: number
  total: number
  pageCount: number
  posts: FeedPost[]
}

function buildQS(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v && v.trim() !== "") sp.set(k, v)
  }
  const s = sp.toString()
  return s ? `?${s}` : ""
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams

  const page = String(sp.page ?? "1")
  const q = typeof sp.q === "string" ? sp.q : ""
  const tag = typeof sp.tag === "string" ? sp.tag : ""
  const verified = typeof sp.verified === "string" ? sp.verified : "0"
  const sort = typeof sp.sort === "string" ? sp.sort : "newest"

  const qs = buildQS({ page, q, tag, verified, sort })

  const h = await headers()
  const proto = h.get("x-forwarded-proto") ?? "http"
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const baseUrl = `${proto}://${host}`

  const res = await fetch(`${baseUrl}/api/posts${qs}`, { cache: "no-store" })
  const data: ApiResp = await res.json()

  const tagsRes = await fetch(`${baseUrl}/api/tags?limit=50`, { cache: "no-store" })
  const tagsJson = await tagsRes.json()

  const posts = data.posts ?? []
  const ALL_TAGS: string[] = (tagsJson?.tags ?? []).map((t: any) => t.name)

  const baseParams = { q, verified, sort }

  const currentPage = Number(data.page || 1)
  const pageCount = Number(data.pageCount || 1)

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
            <Link href="/posts/upsert">New post</Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/posts/saved">Saved</Link>
          </Button>

          <UserNav />
        </div>
      </div>

      <Separator className="my-6" />

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search (GET form -> URL params) */}
          <form className="flex flex-1 items-center gap-2" action="/posts" method="GET">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search posts…"
              className="max-w-xl"
            />
            {/* keep other params */}
            <input type="hidden" name="tag" value={tag} />
            <input type="hidden" name="verified" value={verified} />
            <input type="hidden" name="sort" value={sort} />
            <Button type="submit" variant="outline">Search</Button>
          </form>

          <div className="flex items-center gap-2">
            {/* Sort dropdown -> links */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Sort <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/posts${buildQS({ ...baseParams, tag, page: "1", sort: "newest" })}`}>Newest</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/posts${buildQS({ ...baseParams, tag, page: "1", sort: "most_liked" })}`}>Most liked</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/posts${buildQS({ ...baseParams, tag, page: "1", sort: "most_saved" })}`}>Most saved</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/posts${buildQS({ ...baseParams, tag, page: "1", sort: "most_commented" })}`}>Most commented</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Verified only -> link toggle */}
            <Link
              href={`/posts${buildQS({
                q,
                tag,
                sort,
                page: "1",
                verified: verified === "1" ? "0" : "1",
              })}`}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2"
            >
              <Switch
                id="verified-only"
                checked={verified === "1"}
                aria-readonly
                className="cursor-pointer"
              />
              <span className="text-sm">Verified only</span>
            </Link>
          </div>
        </div>

        {/* Tag chips */}
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant={tag ? "outline" : "secondary"}
            size="sm"
            className="rounded-full"
          >
            <Link href={`/posts${buildQS({ q, verified, sort, page: "1" })}`}>All</Link>
          </Button>

          {ALL_TAGS.map((t) => {
            const active = tag === t
            return (
              <Button
                key={t}
                asChild
                variant={active ? "secondary" : "outline"}
                size="sm"
                className="rounded-full"
              >
                <Link
                  href={`/posts${buildQS({
                    q,
                    verified,
                    sort,
                    page: "1",
                    tag: active ? "" : t,
                  })}`}
                >
                  {t}
                </Link>
              </Button>
            )
          })}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No posts found</CardTitle>
              <CardDescription>Try different filters or clear search.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          asChild
          variant="outline"
          disabled={currentPage <= 1}
        >
          <Link
            href={`/posts${buildQS({
              q,
              tag,
              verified,
              sort,
              page: String(Math.max(1, currentPage - 1)),
            })}`}
          >
            Previous
          </Link>
        </Button>

        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {pageCount} • {data.total} posts
        </div>

        <Button
          asChild
          variant="outline"
          disabled={currentPage >= pageCount}
        >
          <Link
            href={`/posts${buildQS({
              q,
              tag,
              verified,
              sort,
              page: String(Math.min(pageCount, currentPage + 1)),
            })}`}
          >
            Next
          </Link>
        </Button>
      </div>
    </div>
  )
}
