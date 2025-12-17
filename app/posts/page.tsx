import Link from "next/link"
import type { Metadata } from "next"
import { headers } from "next/headers"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { ChevronDown } from "lucide-react"
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

function absBaseUrl(h: Headers) {
  const proto = h.get("x-forwarded-proto") ?? "http"
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  return `${proto}://${host}`
}

function humanSort(sort: string) {
  switch (sort) {
    case "most_liked":
      return "Most liked"
    case "most_saved":
      return "Most saved"
    case "most_commented":
      return "Most commented"
    default:
      return "Newest"
  }
}

function pageTitle({ q, tag, verified, sort, page }: { q: string; tag: string; verified: string; sort: string; page: string }) {
  const bits: string[] = ["Posts"]
  if (tag) bits.push(`Tag: ${tag}`)
  if (q) bits.push(`Search: ${q}`)
  if (verified === "1") bits.push("Verified only")
  bits.push(humanSort(sort))
  if (page && page !== "1") bits.push(`Page ${page}`)
  return bits.join(" • ")
}

function pageDescription({ q, tag, verified }: { q: string; tag: string; verified: string }) {
  const bits: string[] = [
    "Discover Play Store testing posts. Join the Google Group first, then install using the Play Store link as an invited tester.",
  ]
  if (tag) bits.push(`Filtered by tag: ${tag}.`)
  if (q) bits.push(`Results for: “${q}”.`)
  if (verified === "1") bits.push("Showing verified authors only.")
  return bits.join(" ")
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const sp = await searchParams

  const page = String(sp.page ?? "1")
  const q = typeof sp.q === "string" ? sp.q : ""
  const tag = typeof sp.tag === "string" ? sp.tag : ""
  const verified = typeof sp.verified === "string" ? sp.verified : "0"
  const sort = typeof sp.sort === "string" ? sp.sort : "newest"

  const h = await headers()
  const baseUrl = absBaseUrl(h)

  // canonical should reflect the current filter state
  const canonical = `${baseUrl}/posts${buildQS({ page, q, tag, verified, sort })}`

  const title = pageTitle({ q, tag, verified, sort, page })
  const description = pageDescription({ q, tag, verified })

  // optional: avoid indexing “search result” pages (thin/duplicated content)
  const noindex = q.trim().length > 0

  return {
    title,
    description,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  }
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
  const verified = "1"; // typeof sp.verified === "string" ? sp.verified : "0"
  const sort = typeof sp.sort === "string" ? sp.sort : "newest"

  const qs = buildQS({ page, q, tag, verified, sort })

  const h = await headers()
  const baseUrl = absBaseUrl(h)

  const res = await fetch(`${baseUrl}/api/posts${qs}`, { cache: "no-store" })
  const data: ApiResp = await res.json()

  const tagsRes = await fetch(`${baseUrl}/api/tags?limit=50&active=all`, { cache: "no-store" })
  const tagsJson = await tagsRes.json()

  const posts = data.posts ?? []
  const ALL_TAGS: string[] = (tagsJson?.tags ?? []).map((t: any) => t.name)

  const baseParams = { q, verified, sort }
  const currentPage = Number(data.page || 1)
  const pageCount = Number(data.pageCount || 1)

  const prevHref =
    currentPage > 1
      ? `/posts${buildQS({ q, tag, verified, sort, page: String(currentPage - 1) })}`
      : ""
  const nextHref =
    currentPage < pageCount
      ? `/posts${buildQS({ q, tag, verified, sort, page: String(currentPage + 1) })}`
      : ""

  // JSON-LD ItemList for crawlers
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle({ q, tag, verified, sort, page: String(currentPage) }),
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: posts.length,
    itemListElement: posts.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.title,
      // If you have a post detail page, replace with the real URL:
      url: `${baseUrl}/posts/${p.id}`,
    })),
  }

  return (
    <main className="mx-auto w-full max-w-3xl py-8 px-4 ">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
          <p className="text-sm text-muted-foreground">
            Join the Google Group first, then install the Play Store link as an invited tester.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="secondary">
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
      <section aria-label="Post filters" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form className="flex flex-1 items-center gap-2" action="/posts" method="GET">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search posts…"
              className="max-w-xl"
              aria-label="Search posts"
            />
            <input type="hidden" name="tag" value={tag} />
            <input type="hidden" name="verified" value={verified} />
            <input type="hidden" name="sort" value={sort} />
            <Button type="submit" variant="outline" >Search</Button>
          </form>

          <div className="flex items-center gap-2">
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

            {/* <Link
              href={`/posts${buildQS({
                q,
                tag,
                sort,
                page: "1",
                verified: verified === "1" ? "0" : "1",
              })}`}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2"
              aria-label="Toggle verified only"
            >
              <Switch id="verified-only" checked={verified === "1"} aria-readonly className="cursor-pointer" />
              <span className="text-sm">Verified only</span>
            </Link> */}
          </div>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Tags">
          <Button asChild variant={tag ? "outline" : "secondary"} size="sm" className="rounded-full">
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
      </section>

      <Separator className="my-6" />

      {/* Feed */}
      <section aria-label="Posts feed" className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No posts found</CardTitle>
              <CardDescription>Try different filters or clear search.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </section>

      {/* Pagination */}
      <nav aria-label="Pagination" className="mt-8 flex items-center justify-between">
        <Button asChild variant="outline" disabled={currentPage <= 1}>
          <Link rel="prev" href={prevHref || "#"} aria-disabled={currentPage <= 1}>
            Previous
          </Link>
        </Button>

        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {pageCount} • {data.total} posts
        </div>

        <Button asChild variant="outline" disabled={currentPage >= pageCount}>
          <Link rel="next" href={nextHref || "#"} aria-disabled={currentPage >= pageCount}>
            Next
          </Link>
        </Button>
      </nav>
    </main>
  )
}
