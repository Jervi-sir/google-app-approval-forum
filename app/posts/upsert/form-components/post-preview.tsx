import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageItem } from "./screenshots-manager"

interface PostPreviewProps {
  title: string
  content: string
  images: ImageItem[]
  selectedTags: string[]
}

export function PostPreview({
  title,
  content,
  images,
  selectedTags,
}: PostPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border p-4">
          <div className="text-xs text-muted-foreground">How it will look in the feed</div>

          <div className="mt-2 text-base font-semibold">{title.trim() || "Your title here..."}</div>

          <div className="mt-1 text-sm text-muted-foreground">
            {content.trim() ? content.trim().slice(0, 140) + (content.trim().length > 140 ? "…" : "") : "Your description here..."}
          </div>

          <div className="mt-3 space-y-3">
            {images.length > 0 ? (
              <div className="relative h-48 w-full overflow-hidden rounded-md bg-muted">
                <img src={images[0].url} alt="Preview" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-20 w-full rounded-md border border-dashed bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
                No image
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {(selectedTags.length ? selectedTags : ["Finance", "Tools"]).slice(0, 5).map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
