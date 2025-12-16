"use client"

import React, { useMemo, useState } from "react"
import { Info, X, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const SUGGESTED_TAGS = ["Tools", "Finance", "AI", "Health", "Games", "Productivity", "Education"]

interface TagsManagerProps {
  selectedTags: string[]
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>
}

export function TagsManager({ selectedTags, setSelectedTags }: TagsManagerProps) {
  const [tagQuery, setTagQuery] = useState("")
  const [tagOptions, setTagOptions] = useState<{ id: string; name: string; slug: string }[]>([])
  const [isTagLoading, setIsTagLoading] = useState(false)

  const toggleTag = (t: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t)
      if (prev.length >= 5) return prev // keep 2–5-ish; hard stop at 5
      return [...prev, t]
    })
  }

  const removeTag = (t: string) => {
    setSelectedTags((prev) => prev.filter((x) => x !== t))
  }

  const fetchTags = async (q: string) => {
    setIsTagLoading(true)
    try {
      const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}&limit=25`, {
        method: "GET",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to load tags")
      setTagOptions(json.tags || [])
    } catch (e: any) {
      console.error(e)
      setTagOptions([])
    } finally {
      setIsTagLoading(false)
    }
  }

  const onTagSearchChange = async (v: string) => {
    setTagQuery(v)
    if (v.trim().length >= 1) {
      await fetchTags(v.trim())
    } else {
      setTagOptions([])
    }
  }

  const suggestedBySearch = useMemo(() => {
    const q = tagQuery.trim().toLowerCase()
    if (!q) return []
    return tagOptions
      .map((t) => t.name)
      .filter((name) => name.toLowerCase().includes(q))
      .slice(0, 8)
  }, [tagOptions, tagQuery])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>Tags</Label>
        {/* <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setSelectedTags([])
            setTagQuery("")
            setTagOptions([])
          }}
        >
          <Info className="h-4 w-4" />
          Clear
        </Button> */}
      </div>

      {/* Selected */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.length > 0 ? (
          selectedTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => removeTag(t)}
              className="inline-flex"
              aria-label={`Remove tag ${t}`}
            >
              <Badge variant="secondary" className="gap-1">
                {t} <X className="h-3 w-3 opacity-70" />
              </Badge>
            </button>
          ))
        ) : (
          <div className="text-xs text-muted-foreground">No tags yet. Add 1–5.</div>
        )}
      </div>

      {/* Search + API suggestions */}
      <div className="rounded-md border p-3 space-y-3">
        <div className="text-xs text-muted-foreground">Find existing tags</div>

        <Input
          value={tagQuery}
          onChange={(e) => onTagSearchChange(e.target.value)}
          placeholder="Search tags..."
        />

        {isTagLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading tags...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suggestedBySearch.map((t) => (
              <Button
                key={t}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => toggleTag(t)}
                disabled={selectedTags.includes(t) || selectedTags.length >= 5}
              >
                {t}
              </Button>
            ))}

            {tagQuery.trim() && suggestedBySearch.length === 0 && (
              <div className="text-xs text-muted-foreground">No matches. You can add from “Suggested” below.</div>
            )}
          </div>
        )}
      </div>

      {/* Local suggested */}
      <div className="rounded-md border p-3">
        <div className="text-xs text-muted-foreground">Suggested</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTED_TAGS.map((t) => (
            <Button
              key={t}
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => toggleTag(t)}
              disabled={selectedTags.includes(t) || selectedTags.length >= 5}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Keep tags relevant (1–5). Helps users find your post.</p>
    </div>
  )
}
