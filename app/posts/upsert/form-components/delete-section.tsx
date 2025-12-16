"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface DeleteSectionProps {
  postId: string
  onDelete?: () => void
}

export function DeleteSection({ postId, onDelete }: DeleteSectionProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete post")

      if (onDelete) {
        onDelete()
      } else {
        router.push("/posts")
      }
    } catch (error) {
      console.error(error)
      setIsDeleting(false)
      alert("Failed to delete post")
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base">Danger zone</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Deleting a post will remove it from the feed.
      </CardContent>
      <CardFooter className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="destructive"
          className="gap-2"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete post
        </Button>
      </CardFooter>
    </Card>
  )
}
