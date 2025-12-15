import Link from "next/link"
import { notFound } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ExternalLink, Eye, EyeOff, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react"

type AdminPostDetail = {
  id: string
  title: string
  content: string
  playStoreUrl: string
  googleGroupUrl: string
  tags: string[]
  createdAt: string
  updatedAt: string
  moderationStatus: "ok" | "needs_fix" | "hidden"
  isDeleted: boolean
  moderationNote?: string
  author: {
    id: string
    name: string
    isVerified?: boolean
  }
  counts: {
    reports: number
    likes: number
    saves: number
    comments: number
  }
}

const MOCK: Record<string, AdminPostDetail> = {
  p_2: {
    id: "p_2",
    title: "Expense Splitter App (Alpha)",
    content:
      "Need 20 testers to validate multi-currency calculations. Join group then install.\n\nPlease report any rounding issues and screenshots if possible.",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.example.split",
    googleGroupUrl: "https://groups.google.com/g/split-alpha-testers",
    tags: ["Finance", "Tools"],
    createdAt: "1d ago",
    updatedAt: "3h ago",
    moderationStatus: "needs_fix",
    isDeleted: false,
    moderationNote:
      "Please add clearer steps: Join group → wait 5–10 min → open Play Store link. Also confirm the group link is correct.",
    author: { id: "u_2", name: "Samir", isVerified: false },
    counts: { reports: 2, likes: 9, saves: 3, comments: 2 },
  },
  p_4: {
    id: "p_4",
    title: "FREE APK download (100% legit)",
    content:
      "Download the APK from my drive and install. Play Store link not needed. Fast and safe.",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.fake",
    googleGroupUrl: "http://bit.ly/sus-link",
    tags: ["Tools"],
    createdAt: "5d ago",
    updatedAt: "5d ago",
    moderationStatus: "hidden",
    isDeleted: false,
    moderationNote: "Hidden due to multiple malware/spam reports. Investigate user account.",
    author: { id: "u_4", name: "SpamAccount", isVerified: false },
    counts: { reports: 7, likes: 0, saves: 0, comments: 1 },
  },
}

function StatusBadge({
  status,
  isDeleted,
}: {
  status: AdminPostDetail["moderationStatus"]
  isDeleted: boolean
}) {
  if (isDeleted) return <Badge variant="secondary">Deleted</Badge>
  if (status === "needs_fix") return <Badge variant="destructive">Needs fix</Badge>
  if (status === "hidden") return <Badge variant="secondary">Hidden</Badge>
  return <Badge variant="outline">OK</Badge>
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

export default function AdminPostDetailPage({ params }: { params: { id: string } }) {
  const post = MOCK[params.id]
  if (!post) notFound()

  const suspiciousGroup = post.googleGroupUrl.startsWith("http://")
  const isNeedsFix = post.moderationStatus === "needs_fix"
  const isHidden = post.moderationStatus === "hidden"

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      {/* Top nav */}
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/admin/posts">← Back</Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link href={`/posts/${post.id}`}>
              <ExternalLink className="h-4 w-4" />
              View on site
            </Link>
          </Button>

          <ConfirmDialog
            title="Soft delete post?"
            description="This hides the post from normal users. (UI only)"
            confirmLabel="Soft delete"
            trigger={
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            }
          />
        </div>
      </div>

      {/* Header */}
      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
          <StatusBadge status={post.moderationStatus} isDeleted={post.isDeleted} />
          {post.author.isVerified && <Badge>Author Verified</Badge>}
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="font-mono">{post.id}</span> • Created {post.createdAt} • Updated {post.updatedAt}
        </div>

        <div className="text-sm text-muted-foreground">
          Author:{" "}
          <Link href={`/admin/users/${post.author.id}`} className="font-medium text-foreground hover:underline underline-offset-4">
            {post.author.name}
          </Link>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Warnings */}
      <div className="space-y-3">
        {isNeedsFix && (
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Needs fix</AlertTitle>
            <AlertDescription>
              {post.moderationNote ?? "This post requires updates to meet guidelines."}
            </AlertDescription>
          </Alert>
        )}

        {isHidden && (
          <Alert>
            <EyeOff className="h-4 w-4" />
            <AlertTitle>Hidden</AlertTitle>
            <AlertDescription>
              This post is currently hidden from normal users. Review reports before restoring.
            </AlertDescription>
          </Alert>
        )}

        {suspiciousGroup && (
          <Alert>
            <AlertTitle>Suspicious link</AlertTitle>
            <AlertDescription>
              Google Group URL is not HTTPS. Consider hiding the post.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Left: Post content */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Post content</CardTitle>
              <CardDescription>Review the content and links.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Google Group URL</Label>
                <Input value={post.googleGroupUrl} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Play Store URL</Label>
                <Input value={post.playStoreUrl} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Details</Label>
                <Textarea value={post.content} readOnly className="min-h-[180px]" />
              </div>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Moderator note</CardTitle>
              <CardDescription>
                Add a note to explain why you changed status. (UI only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                placeholder="Example: Please add clearer steps: Join group → wait 5–10 min → open Play Store link."
                className="min-h-[120px]"
                defaultValue={post.moderationNote ?? ""}
              />
              <div className="text-xs text-muted-foreground">
                Keep it actionable. This can be shown to the author.
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">Save note</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right: Actions + stats */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
              <CardDescription>Moderation status changes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full gap-2">
                <ShieldCheck className="h-4 w-4" />
                Mark OK
              </Button>

              <Button variant="outline" className="w-full gap-2">
                <ShieldAlert className="h-4 w-4" />
                Mark Needs Fix
              </Button>

              <Button variant="outline" className="w-full gap-2">
                <EyeOff className="h-4 w-4" />
                Hide post
              </Button>

              <Button variant="outline" className="w-full gap-2">
                <Eye className="h-4 w-4" />
                Restore / Unhide
              </Button>

              <Separator />

              <ConfirmDialog
                title="Soft delete post?"
                description="This will remove it from the feed for normal users."
                confirmLabel="Soft delete"
                trigger={
                  <Button variant="destructive" className="w-full gap-2">
                    <Trash2 className="h-4 w-4" />
                    Soft delete
                  </Button>
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stats</CardTitle>
              <CardDescription>Signals and engagement.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-md border p-3 text-center">
                <div className="text-xs text-muted-foreground">Reports</div>
                <div className="text-lg font-semibold">{post.counts.reports}</div>
              </div>
              <div className="rounded-md border p-3 text-center">
                <div className="text-xs text-muted-foreground">Likes</div>
                <div className="text-lg font-semibold">{post.counts.likes}</div>
              </div>
              <div className="rounded-md border p-3 text-center">
                <div className="text-xs text-muted-foreground">Saves</div>
                <div className="text-lg font-semibold">{post.counts.saves}</div>
              </div>
              <div className="rounded-md border p-3 text-center">
                <div className="text-xs text-muted-foreground">Comments</div>
                <div className="text-lg font-semibold">{post.counts.comments}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Links</CardTitle>
              <CardDescription>Open externally to verify quickly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full gap-2">
                <a href={post.googleGroupUrl} target="_blank" rel="noreferrer">
                  Open Google Group <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full gap-2">
                <a href={post.playStoreUrl} target="_blank" rel="noreferrer">
                  Open Play Store <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
