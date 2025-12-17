"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Heart,
  Bookmark,
  MessageSquare,
  Loader2,
  Share2,
  Copy,
  ExternalLink,
  Check,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  postId: string
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
  postId,
}: PostActionsProps) {
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `/share/${postId}`
    return `${window.location.origin}/share/${postId}`
  }, [postId])

  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // fallback
      window.prompt("Copy link:", shareUrl)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3">
      {/* Left actions */}
      <div className="flex items-center gap-2">
        {/* Like */}
        <Button
          variant={likedByMe ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={onToggleLike}
          disabled={likeBusy}
          aria-pressed={likedByMe}
        >
          {likeBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
          <span className="hidden sm:inline">Like</span>
          <span className="ml-0.5 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {likesCount}
          </span>
        </Button>

        {/* Save */}
        <Button
          variant={savedByMe ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={onToggleSave}
          disabled={saveBusy}
          aria-pressed={savedByMe}
        >
          {saveBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
          <span className="hidden sm:inline">Save</span>
          <span className="ml-0.5 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {savesCount}
          </span>
        </Button>

        {/* Share dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Share</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={copyLink} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy link"}
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="gap-2">
              <a href={shareUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open share page
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: comments */}
      <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        <span className="font-medium text-foreground">{commentsCount}</span>
        <span>comments</span>
      </div>
    </div>
  )
}
