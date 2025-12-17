"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ShieldCheck, Loader2, Pencil, Trash2 } from "lucide-react"
import { ReportDialog } from "./report-dialog"
import { useAuthUser } from "@/utils/hooks/use-auth-user"

export type CommentItem = {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  author: { id: string; name: string | null; image?: string | null; isVerified?: boolean | null }
}

type CommentsApi = {
  items: CommentItem[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

function initials(name?: string | null) {
  const n = (name ?? "").trim()
  if (!n) return "??"
  const parts = n.split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("").padEnd(2, "?")
}

function formatTimeLabel(isoOrText: string) {
  const d = new Date(isoOrText)
  if (Number.isNaN(d.getTime())) return isoOrText
  return d.toLocaleString()
}

export function CommentsSection({
  postId,
  onCommentCountChange,
}: {
  postId: string
  onCommentCountChange?: () => void
}) {
  const { authorId: viewerId } = useAuthUser();
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [hasMore, setHasMore] = useState(false)
  const [totalComments, setTotalComments] = useState(0)

  const [newComment, setNewComment] = useState("")
  const [postingComment, setPostingComment] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const [editBusy, setEditBusy] = useState(false)
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null)

  async function fetchComments(nextPage: number, mode: "replace" | "append") {
    if (!postId) return

    setLoading(true)
    setError(null)

    try {
      const qs = new URLSearchParams()
      qs.set("page", String(nextPage))
      qs.set("limit", String(limit))

      const res = await fetch(`/api/posts/${postId}/comments?${qs.toString()}`, { cache: "no-store" })
      const json: CommentsApi & { error?: string } = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to load comments")

      setPage(json.page)
      setHasMore(json.hasMore)
      setTotalComments(json.total)

      if (mode === "replace") setComments(json.items)
      else setComments((prev) => [...prev, ...json.items])
    } catch (e: any) {
      setError(e?.message ?? "Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (postId) fetchComments(1, "replace")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  async function onAddComment() {
    if (!postId) return
    if (!viewerId) {
      setError("You must be logged in to comment.")
      return
    }
    const content = newComment.trim()
    if (!content) return

    setPostingComment(true)
    setError(null)

    try {
      const res = await fetch(`/api/posts/${postId}/comments/new`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ authorId: viewerId, content }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to add comment")

      setNewComment("")

      // Refresh page 1 for consistent ordering + totals
      await fetchComments(1, "replace")
      // Update parent count if needed
      onCommentCountChange?.()
    } catch (e: any) {
      setError(e?.message ?? "Failed to add comment")
    } finally {
      setPostingComment(false)
    }
  }

  async function saveEdit(commentId: string) {
    if (!viewerId) {
      setError("You must be logged in.")
      return
    }
    const content = editingText.trim()
    if (!content) return

    setEditBusy(true)
    setError(null)

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ authorId: viewerId, content }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to edit comment")

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content, updatedAt: json.comment?.updatedAt ?? c.updatedAt } : c))
      )
      cancelEdit()
    } catch (e: any) {
      setError(e?.message ?? "Failed to edit comment")
    } finally {
      setEditBusy(false)
    }
  }

  async function deleteComment(commentId: string) {
    if (!viewerId) {
      setError("You must be logged in.")
      return
    }

    setDeleteBusyId(commentId)
    setError(null)

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ authorId: viewerId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to delete comment")

      // Refresh page 1
      await fetchComments(1, "replace")
      onCommentCountChange?.()
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete comment")
    } finally {
      setDeleteBusyId(null)
    }
  }

  function startEdit(c: CommentItem) {
    setEditingId(c.id)
    setEditingText(c.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingText("")
  }

  const isMine = (authorId?: string | null) => (viewerId ? authorId === viewerId : false)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Comments</h2>
          <p className="text-sm text-muted-foreground">
            Be respectful. Report anything suspicious.
          </p>
        </div>
        <div className="text-xs text-muted-foreground sm:text-right">
          {totalComments} total
        </div>
      </div>

      {/* Add comment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add a comment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment…"
            className="min-h-[110px]"
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Tip: include your device model + Android version for better feedback.
            </p>
            <Button
              onClick={onAddComment}
              className="w-full sm:w-auto"
              disabled={postingComment || newComment.trim().length === 0}
            >
              {postingComment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting…
                </>
              ) : (
                "Post comment"
              )}
            </Button>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Comment list */}
      <div className="space-y-3">
        {loading && comments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading comments…
            </CardContent>
          </Card>
        ) : comments.length === 0 ? (
          <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
            No comments yet. Be the first.
          </div>
        ) : (
          comments.map((c) => {
            const mine = isMine(c.author.id)
            const isEditing = editingId === c.id
            const deleting = deleteBusyId === c.id

            return (
              <Card key={c.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: avatar + content */}
                    <div className="flex gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage
                          src={c.author.image ?? undefined}
                          alt={c.author.name ?? "User"}
                        />
                        <AvatarFallback>{initials(c.author.name)}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link
                            href={`/users/${c.author.id}`}
                            className="max-w-[22ch] truncate font-medium hover:underline underline-offset-4 sm:max-w-none"
                            title={c.author.name ?? "Unknown"}
                          >
                            {c.author.name ?? "Unknown"}
                          </Link>

                          {c.author.isVerified && (
                            <span className="inline-flex items-center gap-1 text-xs text-foreground">
                              <ShieldCheck className="h-4 w-4" />
                              Verified
                            </span>
                          )}

                          <span className="text-xs text-muted-foreground">
                            • {formatTimeLabel(c.createdAt)}
                          </span>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="min-h-[90px]"
                            />
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <Button
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => saveEdit(c.id)}
                                disabled={editBusy || editingText.trim().length === 0}
                              >
                                {editBusy ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                                  </>
                                ) : (
                                  "Save"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={cancelEdit}
                                disabled={editBusy}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
                            {c.content}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex flex-wrap items-center justify-end gap-1 sm:justify-start">
                      {mine && !isEditing && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => startEdit(c)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="hidden sm:inline">Edit</span>
                            <span className="sm:hidden">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-destructive"
                            onClick={() => deleteComment(c.id)}
                            disabled={deleting}
                          >
                            {deleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">Delete</span>
                            <span className="sm:hidden">Delete</span>
                          </Button>
                        </>
                      )}
                      <ReportDialog targetLabel="comment" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          disabled={loading || page <= 1}
          onClick={() => fetchComments(page - 1, "replace")}
        >
          Previous
        </Button>

        <div className="text-center text-xs text-muted-foreground sm:text-left">
          Page {page}
          {totalComments ? ` • ${totalComments} total` : ""}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {hasMore && (
            <Button
              variant="secondary"
              className="w-full sm:w-auto text-center flex justify-center"
              disabled={loading}
              onClick={() => fetchComments(page + 1, "append")}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                </>
              ) : (
                "Load more"
              )}
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={loading || !hasMore}
            onClick={() => fetchComments(page + 1, "replace")}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )

}
