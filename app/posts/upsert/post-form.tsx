"use client"

import Link from "next/link"
import React, { useState } from "react"
import { Plus, Save, Loader2, Info } from "lucide-react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuthUser } from "@/utils/hooks/use-auth-user"

import { ScreenshotsManager, type ImageItem } from "./form-components/screenshots-manager"
import { TagsManager } from "./form-components/tags-manager"
import { DeleteSection } from "./form-components/delete-section"

export type PostData = {
  id?: string
  title: string
  content: string
  playStoreUrl?: string
  googleGroupUrl?: string
  tags: string[]
  images?: string[] // URLs
  moderationStatus?: "ok" | "needs_fix" | "hidden"
  moderationNote?: string
  authorId?: string // optional if you pass it in create/update
}

interface PostFormProps {
  post?: PostData
}

export function PostForm({ post }: PostFormProps) {
  const { loading } = useAuthUser()

  if (loading) return null // or skeleton

  return <Content post={post} />
}

export function Content({ post }: PostFormProps) {
  const { userName, authorId } = useAuthUser()
  const router = useRouter()

  const isEditing = !!post?.id
  const isNeedsFix = post?.moderationStatus === "needs_fix"
  const isHidden = post?.moderationStatus === "hidden"

  const backHref = isEditing ? `/posts/show/${post!.id}` : "/posts"

  const [title, setTitle] = useState(post?.title ?? "")
  const [content, setContent] = useState(post?.content ?? "")
  const [googleGroupUrl, setGoogleGroupUrl] = useState(post?.googleGroupUrl ?? "")
  const [playStoreUrl, setPlayStoreUrl] = useState(post?.playStoreUrl ?? "")

  const [selectedTags, setSelectedTags] = useState<string[]>(post?.tags ?? [])

  const [images, setImages] = useState<ImageItem[]>(() => {
    if (!post?.images?.length) return []
    return post.images.slice(0, 2).map((url) => ({ id: crypto.randomUUID(), url }))
  })

  // We kept MAX_IMAGES constant here if needed for validation pre-submit,
  // but better to let ScreenshotsManager enforce UI. Pre-submit check is still good safety.
  const MAX_IMAGES = 2

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const validateBeforeSubmit = () => {
    if (!title.trim()) return "Title is required."
    if (!content.trim()) return "Description is required."
    if (selectedTags.length < 1) return "Please add at least 1 tag."
    if (selectedTags.length > 5) return "Please keep tags to 5 or less."
    if (!authorId && !post?.authorId) return "Missing authorId. Please sign in."
    if (images.length > MAX_IMAGES) return `Too many images. Max ${MAX_IMAGES}.`
    return null
  }

  const uploadImagesToApi = async (): Promise<string[]> => {
    const finalUrls: string[] = []

    for (const img of images) {
      if (!img.file) {
        finalUrls.push(img.url) // existing URL
        continue
      }

      const form = new FormData()
      form.append("file", img.file)

      const res = await fetch("/api/uploads", { method: "POST", body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Upload failed")

      finalUrls.push(json.publicUrl as string)
    }

    return finalUrls
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const vErr = validateBeforeSubmit()
      if (vErr) {
        setErrorMsg(vErr)
        return
      }

      // 1) Upload new images (if any) and collect final URLs
      const finalImageUrls = await uploadImagesToApi()

      // 2) Submit post create/update
      const payload = {
        authorId: authorId ?? post?.authorId,
        title: title.trim(),
        content: content.trim(),
        googleGroupUrl: googleGroupUrl.trim() || "",
        playStoreUrl: playStoreUrl.trim() || "",
        tags: selectedTags,
        images: finalImageUrls,
      }

      const endpoint = isEditing ? `/api/posts/${post!.id}` : "/api/posts"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to save post")

      setSuccessMsg(isEditing ? "Post updated." : "Post created.")

      if (!isEditing && json.postId) {
        router.push(`/posts/${json.postId}`)
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err?.message || "Failed to upload images or save post.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href={backHref}>← Back</Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild disabled={isSubmitting}>
            <Link href={backHref}>Cancel</Link>
          </Button>
          <Button className="gap-2" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEditing ? (
              <Save className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {!isEditing && !isSubmitting && "Publish"}
            {isEditing && !isSubmitting && "Save changes"}
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{isEditing ? "Edit post" : "Create a post"}</h1>
          {isNeedsFix && <Badge variant="destructive">Needs fix</Badge>}
          {isHidden && <Badge variant="secondary">Hidden</Badge>}
        </div>

        <p className="text-sm text-muted-foreground">
          {isEditing ? (
            "Update your content and links. Only you (and moderators/admins) can edit this post."
          ) : (
            <span>
              Posting as <span className="font-semibold text-foreground">{userName || "Guest"}</span>. Share your app to get testers.
            </span>
          )}
        </p>
      </div>

      <Separator className="my-6" />

      <div className="space-y-6">
        {/* Error / Success */}
        {errorMsg && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMsg}</AlertDescription>
          </Alert>
        )}

        {/* Moderation note */}
        {isEditing && isNeedsFix && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Moderator note</AlertTitle>
            <AlertDescription>{post?.moderationNote ?? "Please update the post to meet guidelines."}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Post details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">

            {/* Links */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="googleGroupUrl">Google Group URL</Label>
                <Input
                  id="googleGroupUrl"
                  value={googleGroupUrl}
                  onChange={(e) => setGoogleGroupUrl(e.target.value)}
                  placeholder="https://groups.google.com/g/your-group"
                />
                <p className="text-xs text-muted-foreground">Users must join this first to be invited.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="playStoreUrl">Play Store URL</Label>
                <Input
                  id="playStoreUrl"
                  value={playStoreUrl}
                  onChange={(e) => setPlayStoreUrl(e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=com.example.app"
                />
                <p className="text-xs text-muted-foreground">Must be a valid Play Store listing URL.</p>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Expense Splitter (Alpha testers needed)"
              />
              <p className="text-xs text-muted-foreground">Keep it short and specific. Mention alpha/beta/invite-only if relevant.</p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Description</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What should testers look for? Any device/version requirements? What feedback do you want?"
                className="min-h-[160px]"
              />
              <p className="text-xs text-muted-foreground">Tip: Ask users to include device model + Android version in comments.</p>
            </div>

            {/* Images */}
            {/* <ScreenshotsManager images={images} setImages={setImages} maxImages={MAX_IMAGES} /> */}

            {/* Tags */}
            <TagsManager selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {isEditing ? "Changes are saved when you click “Save changes”." : "By publishing, you agree not to share malware or misleading links."}
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto" asChild disabled={isSubmitting}>
                <Link href={backHref}>Cancel</Link>
              </Button>
              <Button className="w-full sm:w-auto gap-2" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? <Save className="h-4 w-4" /> : null}
                {!isEditing && !isSubmitting && "Publish"}
                {isEditing && !isSubmitting && "Save changes"}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Preview card (create mode) */}
        {!isEditing && (
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
        )}

        {/* Danger Zone (edit mode) */}
        {isEditing && post?.id && (
          <DeleteSection postId={post.id} />
        )}
      </div>
    </div>
  )
}
