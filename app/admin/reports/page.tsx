import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ChevronDown, ExternalLink, Flag, Filter, Search, ShieldAlert, CheckCircle2, XCircle } from "lucide-react"

type ReportRow = {
  id: string
  createdAt: string
  status: "open" | "reviewing" | "resolved" | "rejected"
  reason: "spam" | "malware" | "hate" | "harassment" | "copyright" | "other"
  targetType: "post" | "comment" | "user"
  targetId: string
  reporter: { id: string; name: string }
  summary?: string
}

const MOCK_REPORTS: ReportRow[] = [
  {
    id: "r_1001",
    createdAt: "10m ago",
    status: "open",
    reason: "malware",
    targetType: "post",
    targetId: "p_4",
    reporter: { id: "u_9", name: "Nadia" },
    summary: "Suspicious short link in Google Group field.",
  },
  {
    id: "r_1002",
    createdAt: "3h ago",
    status: "reviewing",
    reason: "spam",
    targetType: "comment",
    targetId: "c_55",
    reporter: { id: "u_2", name: "Samir" },
    summary: "Repeated promotional message, unrelated to app testing.",
  },
  {
    id: "r_1003",
    createdAt: "2d ago",
    status: "resolved",
    reason: "harassment",
    targetType: "user",
    targetId: "u_77",
    reporter: { id: "u_1", name: "Aimen" },
    summary: "Insults in DMs/comments (needs investigation).",
  },
  {
    id: "r_1004",
    createdAt: "1w ago",
    status: "rejected",
    reason: "other",
    targetType: "post",
    targetId: "p_2",
    reporter: { id: "u_8", name: "Karim" },
    summary: "Report message was empty and non-actionable.",
  },
]

function StatusBadge({ status }: { status: ReportRow["status"] }) {
  if (status === "open") return <Badge variant="destructive">Open</Badge>
  if (status === "reviewing") return <Badge variant="secondary">Reviewing</Badge>
  if (status === "resolved") return <Badge>Resolved</Badge>
  return <Badge variant="outline">Rejected</Badge>
}

function ReasonBadge({ reason }: { reason: ReportRow["reason"] }) {
  if (reason === "malware") return <Badge variant="destructive">Malware</Badge>
  if (reason === "spam") return <Badge variant="secondary">Spam</Badge>
  return <Badge variant="outline">{reason}</Badge>
}

function TargetBadge({ t }: { t: ReportRow["targetType"] }) {
  if (t === "post") return <Badge variant="outline">Post</Badge>
  if (t === "comment") return <Badge variant="outline">Comment</Badge>
  return <Badge variant="outline">User</Badge>
}

export default function AdminReportsPage() {
  const rows = MOCK_REPORTS

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin · Reports</h1>
          <p className="text-sm text-muted-foreground">
            Review abuse reports and take moderation actions. (UI only)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/posts">Posts</Link>
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
            <CardDescription>Search by report id, reporter, or target id.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search… (e.g. r_1001, p_4, Nadia)" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick filters</CardTitle>
            <CardDescription>Status / high-priority types.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              All
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Flag className="h-4 w-4" />
              Open
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <ShieldAlert className="h-4 w-4" />
              Malware
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Incoming reports</CardTitle>
          <CardDescription>
            Prioritize malware reports first. Open each target on site before resolving.
          </CardDescription>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((r) => {
                const targetHref =
                  r.targetType === "post"
                    ? `/posts/${r.targetId}`
                    : r.targetType === "user"
                      ? `/users/${r.targetId}`
                      : "#"

                const adminTargetHref =
                  r.targetType === "post"
                    ? `/admin/posts/${r.targetId}`
                    : r.targetType === "user"
                      ? `/admin/users/${r.targetId}`
                      : "#"

                return (
                  <TableRow key={r.id}>
                    <TableCell className="min-w-[320px]">
                      <div className="space-y-1">
                        <div className="font-medium">
                          <span className="font-mono">{r.id}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.createdAt} • target{" "}
                          <span className="font-mono">{r.targetId}</span>
                        </div>
                        {r.summary && (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {r.summary}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>

                    <TableCell>
                      <ReasonBadge reason={r.reason} />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TargetBadge t={r.targetType} />
                        <span className="font-mono text-xs text-muted-foreground">
                          {r.targetId}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/admin/users/${r.reporter.id}`}
                        className="hover:underline underline-offset-4"
                      >
                        {r.reporter.name}
                      </Link>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={targetHref} className="gap-2">
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
                              <Link href={adminTargetHref}>
                                Open target moderation
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2">
                              <Flag className="h-4 w-4" />
                              Mark reviewing
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Resolve
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <XCircle className="h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Showing {rows.length} reports</div>
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
