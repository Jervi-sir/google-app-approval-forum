"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, EyeOff, ShieldAlert, ShieldCheck, Trash2, Loader2 } from "lucide-react"

export default function ActionsPanelClient({ postId, isDeleted }: { postId: string; isDeleted: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  async function act(action: string) {
    const res = await fetch(`/api/admin/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })

    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      alert(j?.error ?? "Action failed")
      return
    }

    router.refresh()
  }

  return (
    <div className="lg:col-span-2 space-y-6" id="actions">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick actions</CardTitle>
          <CardDescription>Moderation status changes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={pending}
            onClick={() => startTransition(() => act("mark_ok"))}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Mark OK
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={pending}
            onClick={() => startTransition(() => act("mark_needs_fix"))}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
            Mark Needs Fix
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={pending}
            onClick={() => startTransition(() => act("hide"))}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
            Hide post
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={pending}
            onClick={() => startTransition(() => act("restore"))}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Restore / Unhide
          </Button>

          <Separator />

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full gap-2" disabled={pending}>
                <Trash2 className="h-4 w-4" />
                {isDeleted ? "Already deleted" : "Soft delete"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Soft delete post?</DialogTitle>
                <DialogDescription>This hides the post from normal users.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button
                  variant="destructive"
                  disabled={pending || isDeleted}
                  onClick={() => startTransition(() => act("soft_delete"))}
                >
                  {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Soft delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
