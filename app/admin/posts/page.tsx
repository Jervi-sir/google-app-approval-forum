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
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, ExternalLink, Filter, ShieldAlert, Trash2, EyeOff } from "lucide-react"

type AdminPostRow = {
  id: string
  title: string
  author: { id: string; name: string; isVerified?: boolean }
  createdAt: string
  tags: string[]
  moderationStatus: "ok" | "needs_fix" | "hidden"
  isDeleted: boolean
  reportsCount: number
  likesCount: number
  commentsCount: number
}

const MOCK: AdminPostRow[] = [
  {
    id: "p_1",
    title: "Habit Tracker (Invite-only testing)",
    author: { id: "u_1", name: "Aimen", isVerified: true },
    createdAt: "2h ago",
    tags: ["Productivity", "Health"],
    moderationStatus: "ok",
    isDeleted: false,
    reportsCount: 0,
    likesCount: 31,
    commentsCount: 8,
  },
  {
    id: "p_2",
    title: "Expense Splitter App (Alpha)",
    author: { id: "u_2", name: "Samir", isVerified: false },
    createdAt: "1d ago",
    tags: ["Finance", "Tools"],
    moderationStatus: "needs_fix",
    isDeleted: false,
    reportsCount: 2,
    likesCount: 9,
    commentsCount: 2,
  },
  {
    id: "p_4",
    title: "FREE APK download (100% legit)",
    author: { id: "u_4", name: "SpamAccount", isVerified: false },
    createdAt: "5d ago",
    tags: ["Tools"],
    moderationStatus: "hidden",
    isDeleted: false,
    reportsCount: 7,
    likesCount: 0,
    commentsCount: 1,
  },
  {
    id: "p_5",
    title: "Old test post (ignore)",
    author: { id: "u_5", name: "DevUser", isVerified: false },
    createdAt: "2w ago",
    tags: ["Education"],
    moderationStatus: "ok",
    isDeleted: true,
    reportsCount: 0,
    likesCount: 1,
    commentsCount: 0,
  },
]

function StatusBadge({
  moderationStatus,
  isDeleted,
}: {
  moderationStatus: AdminPostRow["moderationStatus"]
  isDeleted: boolean
}) {
  if (isDeleted) return <Badge variant="secondary">Deleted</Badge>
  if (moderationStatus === "needs_fix") return <Badge variant="destructive">Needs fix</Badge>
  if (moderationStatus === "hidden") return <Badge variant="secondary">Hidden</Badge>
  return <Badge variant="outline">OK</Badge>
}

export default function AdminPostsPage() {
  const rows = MOCK

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin · Posts</h1>
          <p className="text-sm text-muted-foreground">
            Moderate posts: hide, mark as needs-fix, or soft-delete. (UI only)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/reports">Reports</Link>
          </Button>
          <Button asChild>
            <Link href="/posts">View site</Link>
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="sm:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Search</CardTitle>
            <CardDescription>Find posts by title, author, or id.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input placeholder="Search… (e.g. 'Expense', 'u_2', 'p_4')" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Status and quick scopes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              All
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <ShieldAlert className="h-4 w-4" />
              Needs fix
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <EyeOff className="h-4 w-4" />
              Hidden
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Deleted
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Posts</CardTitle>
          <CardDescription>Manage content visibility and quality.</CardDescription>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="text-right">Reports</TableHead>
                <TableHead className="text-right">Likes</TableHead>
                <TableHead className="text-right">Comments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="min-w-[360px]">
                    <div className="space-y-1">
                      <div className="font-medium">
                        <Link
                          href={`/admin/posts/${p.id}`}
                          className="hover:underline underline-offset-4"
                        >
                          {p.title}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-mono">{p.id}</span> • {p.createdAt}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {p.tags.slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                        {p.tags.length > 3 && (
                          <Badge variant="outline">+{p.tags.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <StatusBadge moderationStatus={p.moderationStatus} isDeleted={p.isDeleted} />
                  </TableCell>

                  <TableCell className="min-w-[180px]">
                    <Link
                      href={`/admin/users/${p.author.id}`}
                      className="hover:underline underline-offset-4"
                    >
                      {p.author.name}
                    </Link>
                    {p.author.isVerified && (
                      <div className="mt-1 text-xs text-muted-foreground">Verified</div>
                    )}
                  </TableCell>

                  <TableCell className="text-right">{p.reportsCount}</TableCell>
                  <TableCell className="text-right">{p.likesCount}</TableCell>
                  <TableCell className="text-right">{p.commentsCount}</TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/posts/${p.id}`} className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Site
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            Actions <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/posts/${p.id}`}>Open moderation</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Mark OK</DropdownMenuItem>
                          <DropdownMenuItem>Mark Needs Fix</DropdownMenuItem>
                          <DropdownMenuItem>Hide</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Soft delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Showing {rows.length} posts</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled>
              Previous
            </Button>
            <Button variant="outline">Next</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
