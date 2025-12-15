import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, Trash2 } from "lucide-react"

type TagRow = {
  id: string
  name: string
  slug: string
  postsCount: number
  createdAt: string
}

const MOCK_TAGS: TagRow[] = [
  { id: "t_1", name: "Tools", slug: "tools", postsCount: 18, createdAt: "Nov 2025" },
  { id: "t_2", name: "Finance", slug: "finance", postsCount: 9, createdAt: "Nov 2025" },
  { id: "t_3", name: "AI", slug: "ai", postsCount: 6, createdAt: "Dec 2025" },
  { id: "t_4", name: "Health", slug: "health", postsCount: 11, createdAt: "Dec 2025" },
  { id: "t_5", name: "Productivity", slug: "productivity", postsCount: 22, createdAt: "Oct 2025" },
]

function CreateTagDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New tag
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create tag</DialogTitle>
          <DialogDescription>
            Tags help users discover posts. Keep them short and clear.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Name</Label>
            <Input id="tag-name" placeholder="e.g. Productivity" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-slug">Slug</Label>
            <Input id="tag-slug" placeholder="e.g. productivity" />
            <p className="text-xs text-muted-foreground">
              Lowercase, no spaces. Usually derived automatically.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminTagsPage() {
  const tags = MOCK_TAGS

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin · Tags</h1>
          <p className="text-sm text-muted-foreground">
            Manage tags used for filtering and discovery. (UI only)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/posts">Posts</Link>
          </Button>
          <CreateTagDialog />
        </div>
      </div>

      <Separator className="my-6" />

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search</CardTitle>
          <CardDescription>Find tags by name or slug.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search… (e.g. tools, finance)" />
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tags</CardTitle>
          <CardDescription>
            You can delete unused tags to keep the UI clean.
          </CardDescription>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Posts</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {tags.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="min-w-[240px]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{t.name}</Badge>
                        <span className="text-xs text-muted-foreground">Created {t.createdAt}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">{t.id}</div>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-sm">{t.slug}</TableCell>

                  <TableCell className="text-right">{t.postsCount}</TableCell>

                  <TableCell className="text-right">
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Showing {tags.length} tags</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled>
              Previous
            </Button>
            <Button variant="outline" disabled>
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
