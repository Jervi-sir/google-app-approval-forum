"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, Flag, Loader2 } from "lucide-react"

const REASONS = [
  { key: "spam", label: "Spam" },
  { key: "malware", label: "Malware" },
  { key: "hate", label: "Hate" },
  { key: "harassment", label: "Harassment" },
  { key: "copyright", label: "Copyright" },
  { key: "other", label: "Other" },
] as const

export default function ReportUserDialog({ targetUserId, targetName }: { targetUserId: string; targetName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<(typeof REASONS)[number]>(REASONS[0])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit() {
    setLoading(true)
    setErr(null)

    const res = await fetch("/api/reports", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "user",
        targetUserId,
        reason: reason.key,
        message: message.trim() || null,
      }),
    })

    if (res.status === 401) {
      setLoading(false)
      setOpen(false)
      router.push(`/auth/signin?redirect=${encodeURIComponent(`/users/${targetUserId}`)}`)
      return
    }

    if (!res.ok) {
      let msg = `Request failed (${res.status})`
      try {
        const j = await res.json()
        msg = j?.error ? String(j.error) : msg
      } catch { }
      setErr(msg)
      setLoading(false)
      return
    }

    setLoading(false)
    setDone(true)
    setTimeout(() => {
      setOpen(false)
      setDone(false)
      setMessage("")
      setReason(REASONS[0])
    }, 700)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setErr(null); setDone(false) } }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Flag className="h-4 w-4" />
          Report user
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report {targetName}</DialogTitle>
          <DialogDescription>Pick a reason and add optional context. Reports are reviewed by moderators.</DialogDescription>
        </DialogHeader>

        {err && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {err}
          </div>
        )}

        {done ? (
          <div className="rounded-md border bg-muted/30 p-4 text-sm">
            Thanks — your report was submitted.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {reason.label} <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                  {REASONS.map((r) => (
                    <DropdownMenuItem key={r.key} onClick={() => setReason(r)}>
                      {r.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-message">Message (optional)</Label>
              <Textarea
                id="report-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add details (optional)…"
                className="min-h-[110px]"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading || done}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
