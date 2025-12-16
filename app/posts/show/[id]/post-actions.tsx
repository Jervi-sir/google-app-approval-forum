"use client"

import { Button } from "@/components/ui/button"
import { Heart, Bookmark, MessageSquare, Loader2 } from "lucide-react"

type PostActionsProps = {
  likedByMe: boolean
  savedByMe: boolean
  likesCount: number
  savesCount: number
  commentsCount: number
  onToggleLike: () => void
  onToggleSave: () => void
  likeBusy: boolean
  saveBusy: boolean
}

export function PostActions({
  likedByMe,
  savedByMe,
  likesCount,
  savesCount,
  commentsCount,
  onToggleLike,
  onToggleSave,
  likeBusy,
  saveBusy,
}: PostActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <Button
          variant={likedByMe ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={onToggleLike}
          disabled={likeBusy}
        >
          {likeBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
          Like <span className={!likedByMe ? "text-muted-foreground" : "text-muted"}>({likesCount})</span>
        </Button>

        <Button
          variant={savedByMe ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={onToggleSave}
          disabled={saveBusy}
        >
          {saveBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
          Save <span className={!savedByMe ? "text-muted-foreground" : "text-muted"}>({savesCount})</span>
        </Button>
      </div>

      <div className="text-sm text-muted-foreground inline-flex items-center gap-1">
        <MessageSquare className="h-4 w-4" />
        {commentsCount} comments
      </div>
    </div>
  )
}
