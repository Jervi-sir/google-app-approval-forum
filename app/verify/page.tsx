// app/verify/page.tsx
"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

import { CheckCircle2, Clock, ShieldCheck, XCircle, Loader2, RefreshCcw } from "lucide-react"

type VerificationState =
  | { status: "not_requested" }
  | { status: "pending"; submittedAt: string }
  | { status: "approved"; approvedAt: string; note?: string }
  | { status: "rejected"; reviewedAt: string; note?: string }

type VerifyMe = {
  user: {
    id: string
    role: "user" | "moderator" | "admin"
    isVerified: boolean
  }
  state: VerificationState
}

type SubmitPayload = {
  playStoreDeveloperUrl?: string | null
  proofMessage: string
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const res = await fetch(url, {
    cache: "no-store",
    credentials: "include",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  })

  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try {
      const j = await res.json()
      msg = j?.error ? String(j.error) : msg
    } catch { }
    return { ok: false, status: res.status, error: msg }
  }

  // some endpoints may return 204
  if (res.status === 204) return { ok: true, data: undefined as any }
  return { ok: true, data: (await res.json()) as T }
}

function StatusCard({
  state,
  role,
  isVerified,
  onRefresh,
  refreshing,
}: {
  state: VerificationState
  role: "user" | "moderator" | "admin"
  isVerified: boolean
  onRefresh: () => void
  refreshing?: boolean
}) {
  const topLine = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
        <span>{isVerified ? "Verified" : "Not verified"}</span>
        <Badge variant="outline">{role}</Badge>
      </div>

      <Button variant="outline" size="sm" className="gap-2" onClick={onRefresh} disabled={refreshing}>
        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        Refresh
      </Button>
    </div>
  )

  if (state.status === "not_requested") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>You haven’t requested verification yet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {topLine}
          <div className="text-sm text-muted-foreground">
            Submit a request on the left. A moderator will review it.
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
          {topLine}

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Pending</span>
            <Badge variant="secondary">In review</Badge>
          </div>
          <div className="text-sm text-muted-foreground">Submitted: {state.submittedAt}</div>

          <Alert>
            <AlertTitle>While you wait</AlertTitle>
            <AlertDescription>
              Make sure your posts include clear steps: Join group → wait 5–10 minutes → open Play Store.
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
          {topLine}

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
            <Link href="/posts/upsert">Create a post</Link>
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
        {topLine}

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
            A Play Store developer profile link (if you have one) + a short explanation of ownership (screenshots, email
            proof, or a signed message).
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="outline" className="w-full">
          <Link href="/profile">Back to profile</Link>
        </Button>
        <Button asChild className="w-full">
          <Link href="#request">Request again</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function VerifyPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [role, setRole] = useState<"user" | "moderator" | "admin">("user")
  const [isVerified, setIsVerified] = useState(false)
  const [state, setState] = useState<VerificationState>({ status: "not_requested" })

  // form
  const [devUrl, setDevUrl] = useState("")
  const [proof, setProof] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)
  const [formOk, setFormOk] = useState<string | null>(null)

  const load = useCallback(
    async (mode?: "refresh") => {
      if (mode === "refresh") setRefreshing(true)
      else setLoading(true)

      setErr(null)

      // guard: must be logged-in
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace("/auth/signin?redirect=/verify")
        return
      }

      const r = await fetchJson<VerifyMe>("/api/verify/me")
      if (!r.ok) {
        setErr(r.error)
        if (r.status === 401) router.replace("/auth/signin?redirect=/verify")
        setLoading(false)
        setRefreshing(false)
        return
      }

      setRole(r.data.user.role)
      setIsVerified(r.data.user.isVerified)
      setState(r.data.state)

      setLoading(false)
      setRefreshing(false)
    },
    [router, supabase],
  )

  useEffect(() => {
    void load()
  }, [load])

  const submit = useCallback(async () => {
    setFormErr(null)
    setFormOk(null)

    const proofMessage = proof.trim()
    if (proofMessage.length < 20) {
      setFormErr("Please write a clearer proof message (at least ~20 chars).")
      return
    }

    const payload: SubmitPayload = {
      playStoreDeveloperUrl: devUrl.trim() || null,
      proofMessage,
    }

    setSubmitting(true)
    const r = await fetchJson<{ ok: true }>("/api/verify/request", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    setSubmitting(false)

    if (!r.ok) {
      setFormErr(r.error)
      return
    }

    setFormOk("Request submitted. It should appear as Pending.")
    // refresh status
    void load("refresh")
  }, [devUrl, proof, load])

  const canSubmit = useMemo(() => {
    // allow submit only if not pending/approved (you can tweak)
    if (state.status === "pending") return false
    if (state.status === "approved") return false
    return true
  }, [state.status])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading verification…
        </div>
      </div>
    )
  }

  if (err) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <Card className="border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">Couldn’t load verification</CardTitle>
            <CardDescription>{err}</CardDescription>
          </CardHeader>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={() => load("refresh")} className="gap-2">
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Retry
            </Button>
            <Button asChild>
              <Link href="/profile">Back</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Verification</h1>
          <p className="text-sm text-muted-foreground">Get a “Verified” badge so testers can trust your posts more.</p>
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
              <CardDescription>Verification helps reduce spam and makes your app posts more credible.</CardDescription>
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

          {/* Request form */}
          <Card id="request">
            <CardHeader>
              <CardTitle className="text-base">Request verification</CardTitle>
              <CardDescription>Submit once. If rejected, you can resubmit with better proof.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {formErr && (
                <Alert>
                  <AlertTitle>Couldn’t submit</AlertTitle>
                  <AlertDescription>{formErr}</AlertDescription>
                </Alert>
              )}

              {formOk && (
                <Alert>
                  <AlertTitle>Done</AlertTitle>
                  <AlertDescription>{formOk}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="devUrl">Play Store developer profile URL (optional)</Label>
                <Input
                  id="devUrl"
                  value={devUrl}
                  onChange={(e) => setDevUrl(e.target.value)}
                  placeholder="https://play.google.com/store/apps/dev?id=1234567890"
                  disabled={!canSubmit || submitting}
                />
                <p className="text-xs text-muted-foreground">Optional, but improves approval speed.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof">Proof message</Label>
                <Textarea
                  id="proof"
                  value={proof}
                  onChange={(e) => setProof(e.target.value)}
                  placeholder="Explain how you own/control this app or developer account. Include any proof context (email, screenshots, etc.)."
                  className="min-h-[140px]"
                  disabled={!canSubmit || submitting}
                />
                <p className="text-xs text-muted-foreground">Keep it clear and specific. Don’t include passwords or secrets.</p>
              </div>

              {!canSubmit && state.status === "pending" ? (
                <Alert>
                  <AlertTitle>Already submitted</AlertTitle>
                  <AlertDescription>Your request is pending. You can’t submit another until it’s reviewed.</AlertDescription>
                </Alert>
              ) : null}

              {!canSubmit && state.status === "approved" ? (
                <Alert>
                  <AlertTitle>Already verified</AlertTitle>
                  <AlertDescription>You’re approved, so there’s nothing to submit.</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>

            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" className="w-full sm:w-auto" asChild disabled={submitting}>
                <Link href="/profile">Cancel</Link>
              </Button>

              <Button
                className="w-full sm:w-auto"
                onClick={submit}
                disabled={!canSubmit || submitting}
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit request
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right: status */}
        <div className="lg:col-span-2">
          <StatusCard
            state={state}
            role={role}
            isVerified={isVerified}
            onRefresh={() => load("refresh")}
            refreshing={refreshing}
          />
        </div>
      </div>
    </div>
  )
}
