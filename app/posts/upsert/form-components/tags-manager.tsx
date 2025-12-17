"use client"

import React, { useMemo, useState } from "react"
import { X, Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const SUGGESTED_TAGS = ["Tools", "Finance", "AI", "Health", "Games", "Productivity", "Education"]

type TagRow = { id: string; name: string; slug: string }

interface TagsManagerProps {
  selectedTags: string[]
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>
}

export function TagsManager({ selectedTags, setSelectedTags }: TagsManagerProps) {
  const [tagQuery, setTagQuery] = useState("")
  const [tagOptions, setTagOptions] = useState<TagRow[]>([])
  const [isTagLoading, setIsTagLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const canAddMore = selectedTags.length < 5

  const toggleTag = (t: string) => {
    const clean = t.trim()
    if (!clean) return
    setSelectedTags((prev) => {
      if (prev.includes(clean)) return prev.filter((x) => x !== clean)
      if (prev.length >= 5) return prev
      return [...prev, clean]
    })
  }

  const removeTag = (t: string) => setSelectedTags((prev) => prev.filter((x) => x !== t))

  const fetchTags = async (q: string) => {
    setIsTagLoading(true)
    try {
      const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}&limit=25`, { method: "GET" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to load tags")
      setTagOptions(json.tags || [])
    } catch (e) {
      console.error(e)
      setTagOptions([])
    } finally {
      setIsTagLoading(false)
    }
  }

  const onTagSearchChange = async (v: string) => {
    setTagQuery(v)
    const q = v.trim()
    if (q.length >= 1) await fetchTags(q)
    else setTagOptions([])
  }

  const normalizedSelected = useMemo(
    () => new Set(selectedTags.map((t) => t.trim().toLowerCase())),
    [selectedTags]
  )

  const suggestedBySearch = useMemo(() => {
    const q = tagQuery.trim().toLowerCase()
    if (!q) return []
    // show API results first, as names
    return tagOptions.map((t) => t.name).slice(0, 8)
  }, [tagOptions, tagQuery])

  const exactNameExistsInDb = useMemo(() => {
    const q = tagQuery.trim().toLowerCase()
    if (!q) return false
    return tagOptions.some((t) => t.name.trim().toLowerCase() === q)
  }, [tagOptions, tagQuery])

  const canCreateThis = useMemo(() => {
    const q = tagQuery.trim()
    if (!q) return false
    if (q.length > 48) return false
    if (!canAddMore) return false
    if (normalizedSelected.has(q.toLowerCase())) return false
    // if you want STRICT “only create when not in DB”:
    if (exactNameExistsInDb) return false
    return true
  }, [tagQuery, canAddMore, normalizedSelected, exactNameExistsInDb])

  const createTag = async (name: string) => {
    const clean = name.trim().slice(0, 48)
    if (!clean) return

    setIsCreating(true)
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to create tag")

      const created: TagRow = json.tag
      // ensure it appears in options and gets selected
      setTagOptions((prev) => {
        const exists = prev.some((t) => t.slug === created.slug)
        return exists ? prev : [created, ...prev]
      })
      toggleTag(created.name)

      // nice UX: clear search
      setTagQuery("")
      setTagOptions([])
    } catch (e) {
      console.error(e)
      // (optional) show toast here
    } finally {
      setIsCreating(false)
    }
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = async (e) => {
    if (e.key !== "Enter") return
    e.preventDefault()

    const q = tagQuery.trim()
    if (!q) return

    // if there is an exact match in results, pick it
    const exact = tagOptions.find((t) => t.name.trim().toLowerCase() === q.toLowerCase())
    if (exact) {
      toggleTag(exact.name)
      setTagQuery("")
      setTagOptions([])
      return
    }

    // otherwise create
    if (canCreateThis) await createTag(q)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>Tags</Label>
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

      {/* Search + API suggestions + Create */}
      <div className="rounded-md border p-3 space-y-3">
        <div className="text-xs text-muted-foreground">Find or create tags</div>

        <Input
          value={tagQuery}
          onChange={(e) => onTagSearchChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search tags... (press Enter to add/create)"
        />

        {(isTagLoading || isCreating) ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            {isCreating ? "Creating tag..." : "Loading tags..."}
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
                disabled={selectedTags.includes(t) || !canAddMore}
              >
                {t}
              </Button>
            ))}

            {/* Create CTA */}
            {canCreateThis && (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="rounded-full gap-2"
                onClick={() => createTag(tagQuery)}
              >
                <Plus className="h-4 w-4" />
                Create “{tagQuery.trim()}”
              </Button>
            )}

            {tagQuery.trim() && suggestedBySearch.length === 0 && !canCreateThis && (
              <div className="text-xs text-muted-foreground">
                {canAddMore ? "No matches." : "You already selected 5 tags."}
              </div>
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
              disabled={selectedTags.includes(t) || !canAddMore}
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
