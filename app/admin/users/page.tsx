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
import { ChevronDown, Search, ShieldCheck, UserCog } from "lucide-react"

type AdminUserRow = {
  id: string
  name: string
  email: string
  role: "user" | "moderator" | "admin"
  isVerified: boolean
  createdAt: string
  postsCount: number
  reportsCount: number
}

const MOCK_USERS: AdminUserRow[] = [
  {
    id: "u_1",
    name: "Aimen",
    email: "aimen@example.com",
    role: "admin",
    isVerified: true,
    createdAt: "Dec 2025",
    postsCount: 5,
    reportsCount: 0,
  },
  {
    id: "u_3",
    name: "Nadia",
    email: "nadia@example.com",
    role: "moderator",
    isVerified: true,
    createdAt: "Nov 2025",
    postsCount: 3,
    reportsCount: 1,
  },
  {
    id: "u_2",
    name: "Samir",
    email: "samir@example.com",
    role: "user",
    isVerified: false,
    createdAt: "Nov 2025",
    postsCount: 2,
    reportsCount: 2,
  },
  {
    id: "u_4",
    name: "SpamAccount",
    email: "spam@fake.com",
    role: "user",
    isVerified: false,
    createdAt: "Dec 2025",
    postsCount: 12,
    reportsCount: 7,
  },
]

function RoleBadge({ role }: { role: AdminUserRow["role"] }) {
  if (role === "admin") return <Badge>Admin</Badge>
  if (role === "moderator") return <Badge variant="secondary">Moderator</Badge>
  return <Badge variant="outline">User</Badge>
}

export default function AdminUsersPage() {
  const rows = MOCK_USERS

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin · Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage roles and verification state. (UI only)
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

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search</CardTitle>
          <CardDescription>Search by name, email, or id.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search… (e.g. Nadia, spam@, u_2)" />
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Users</CardTitle>
          <CardDescription>
            Promotions should be rare. Verification can be managed in user detail.
          </CardDescription>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="text-right">Posts</TableHead>
                <TableHead className="text-right">Reports</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="min-w-[320px]">
                    <div className="space-y-1">
                      <div className="font-medium">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="hover:underline underline-offset-4"
                        >
                          {u.name}
                        </Link>
                      </div>
                      <div className="text-sm text-muted-foreground">{u.email}</div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-mono">{u.id}</span> • Joined {u.createdAt}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <RoleBadge role={u.role} />
                  </TableCell>

                  <TableCell>
                    {u.isVerified ? (
                      <span className="inline-flex items-center gap-2 text-sm">
                        <ShieldCheck className="h-4 w-4" />
                        Yes
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">No</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">{u.postsCount}</TableCell>
                  <TableCell className="text-right">{u.reportsCount}</TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/users/${u.id}`}>Open</Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            Actions <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${u.id}`} className="gap-2">
                              <UserCog className="h-4 w-4" />
                              Manage
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem>Promote to moderator</DropdownMenuItem>
                          <DropdownMenuItem>Demote to user</DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem>Force verify</DropdownMenuItem>
                          <DropdownMenuItem>Remove verification</DropdownMenuItem>
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
          <div className="text-sm text-muted-foreground">Showing {rows.length} users</div>
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
