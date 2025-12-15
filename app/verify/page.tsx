import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react"

type VerificationState =
  | { status: "not_requested" }
  | { status: "pending"; submittedAt: string }
  | { status: "approved"; approvedAt: string; note?: string }
  | { status: "rejected"; reviewedAt: string; note?: string }

const MOCK_STATE: VerificationState = {
  status: "pending",
  submittedAt: "Dec 15, 2025",
}

// Examples:
// const MOCK_STATE: VerificationState = { status: "not_requested" }
// const MOCK_STATE: VerificationState = { status: "approved", approvedAt: "Dec 10, 2025", note: "Verified via Play Store developer page." }
// const MOCK_STATE: VerificationState = { status: "rejected", reviewedAt: "Dec 11, 2025", note: "Proof was unclear. Please provide Play Store dev profile or a signed statement." }

function StatusCard({ state }: { state: VerificationState }) {
  if (state.status === "not_requested") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>You haven’t requested verification yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>Not verified</span>
            <Badge variant="outline">User</Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (state.status === "pending") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>Your request is waiting for review.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Pending</span>
            <Badge variant="secondary">In review</Badge>
          </div>
          <div className="text-sm text-muted-foreground">Submitted: {state.submittedAt}</div>
          <Alert>
            <AlertTitle>While you wait</AlertTitle>
            <AlertDescription>
              Make sure your posts include correct links and clear instructions: Join group → wait 5–10 minutes → open Play Store.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/profile">Back to profile</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (state.status === "approved") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>You’re verified ✅</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Approved</span>
            <Badge>Verified</Badge>
          </div>
          <div className="text-sm text-muted-foreground">Approved: {state.approvedAt}</div>
          {state.note && (
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">Reviewer note</div>
              <div className="mt-1">{state.note}</div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/posts/new">Create a post</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // rejected
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status</CardTitle>
        <CardDescription>Your request was rejected.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <XCircle className="h-4 w-4" />
          <span className="font-medium">Rejected</span>
          <Badge variant="destructive">Needs more proof</Badge>
        </div>
        <div className="text-sm text-muted-foreground">Reviewed: {state.reviewedAt}</div>

        {state.note && (
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">Reviewer note</div>
            <div className="mt-1">{state.note}</div>
          </div>
        )}

        <Alert>
          <AlertTitle>What to include next time</AlertTitle>
          <AlertDescription>
            A Play Store developer profile link (if you have one) + a short explanation of ownership (screenshots, email proof, or a signed message).
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="outline" className="w-full">
          <Link href="/profile">Back to profile</Link>
        </Button>
        <Button className="w-full">Request again</Button>
      </CardFooter>
    </Card>
  )
}

export default function VerifyPage() {
  const state = MOCK_STATE

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Verification</h1>
          <p className="text-sm text-muted-foreground">
            Get a “Verified” badge so testers can trust your posts more.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/profile">Back to profile</Link>
          </Button>
          <Button asChild>
            <Link href="/posts">Browse posts</Link>
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: info + form */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How verification works</CardTitle>
              <CardDescription>
                Verification helps reduce spam and makes your app posts more credible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide a short proof message explaining that you own the app.</li>
                <li>If possible, include your Play Store developer profile URL.</li>
                <li>Moderators/admins review requests and may ask for additional proof.</li>
              </ul>
              <Alert>
                <AlertTitle>Tip</AlertTitle>
                <AlertDescription>
                  The fastest approvals usually include a developer profile link + a clear explanation.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Request form (UI only) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request verification</CardTitle>
              <CardDescription>
                Fill this once. You can resubmit if rejected.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="devUrl">Play Store developer profile URL (optional)</Label>
                <Input
                  id="devUrl"
                  placeholder="https://play.google.com/store/apps/dev?id=1234567890"
                />
                <p className="text-xs text-muted-foreground">
                  Optional, but improves approval speed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof">Proof message</Label>
                <Textarea
                  id="proof"
                  placeholder="Explain how you own/control this app or developer account. Include any proof context (email, screenshots, etc.)."
                  className="min-h-[140px]"
                />
                <p className="text-xs text-muted-foreground">
                  Keep it clear and specific. Don’t include passwords or secrets.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/profile">Cancel</Link>
              </Button>
              <Button className="w-full sm:w-auto">Submit request</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right: status */}
        <div className="lg:col-span-2">
          <StatusCard state={state} />
        </div>
      </div>
    </div>
  )
}
