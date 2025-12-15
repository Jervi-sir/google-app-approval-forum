"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Plus, Save, Trash2, X, Image as ImageIcon, Loader2 } from "lucide-react"
import imageCompression from "browser-image-compression"
import { createClient } from "@/utils/supabase/client"

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
}

const SUGGESTED_TAGS = ["Tools", "Finance", "AI", "Health", "Games", "Productivity", "Education"]

interface PostFormProps {
  post?: PostData
  userName?: string
}

type ImageItem = {
  id: string
  url: string
  file?: File
}

export function PostForm({ post, userName }: PostFormProps) {
  const isEditing = !!post
  const isNeedsFix = post?.moderationStatus === "needs_fix"
  const isHidden = post?.moderationStatus === "hidden"

  const defaultTitle = post?.title ?? ""
  const defaultContent = post?.content ?? ""
  const defaultGoogleGroupUrl = post?.googleGroupUrl ?? ""
  const defaultPlayStoreUrl = post?.playStoreUrl ?? ""
  const defaultTags = post?.tags ?? []

  // Initialize images state
  const [images, setImages] = useState<ImageItem[]>(() => {
    if (!post?.images) return []
    return post.images.map((url) => ({
      id: crypto.randomUUID(),
      url,
    }))
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const backHref = isEditing && post?.id ? `/posts/${post.id}` : "/posts"

  const MAX_BYTES = 30 * 1024; // 30KB

  const compressToMaxBytes = async (file: File, maxBytes: number) => {
    // Start conservative
    let maxDim = 720;          // reduce more if needed
    let quality = 0.65;        // start quality
    let current: File = file;

    // Try multiple passes
    for (let i = 0; i < 8; i++) {
      const compressed = await imageCompression(current, {
        maxWidthOrHeight: maxDim,
        useWebWorker: true,
        fileType: "image/webp",
        // browser-image-compression doesn't expose "quality" directly in all builds,
        // but "initialQuality" works in many versions. If your version ignores it,
        // the size loop + dimension drop still works.
        initialQuality: quality as any,
      } as any);

      // If it's small enough, return
      if (compressed.size <= maxBytes) return compressed;

      // Otherwise reduce more for next pass
      current = compressed;
      maxDim = Math.max(320, Math.floor(maxDim * 0.8));   // shrink dimensions
      quality = Math.max(0.25, quality - 0.1);            // reduce quality
    }

    // Best effort result (may still be > maxBytes for some images)
    return current;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    if (images.length + files.length > 2) {
      setErrorMsg("You can only upload a maximum of 2 images.");
      return;
    }

    const newItems: ImageItem[] = [];

    for (const file of Array.from(files)) {
      try {
        const compressedFile = await compressToMaxBytes(file, MAX_BYTES);

        // optional: warn if we couldn't reach 30KB (some images are stubborn)
        if (compressedFile.size > MAX_BYTES) {
          console.warn(
            `Could not reach 30KB. Final size: ${Math.round(compressedFile.size / 1024)}KB`
          );
        }

        const url = URL.createObjectURL(compressedFile);

        newItems.push({
          id: crypto.randomUUID(),
          url,
          file: compressedFile,
        });
      } catch (error) {
        console.error("Compression error:", error);
        setErrorMsg("Failed to process one or more images.");
      }
    }

    setImages((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };


  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handlePublishObj = async () => {
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const supabase = createClient()
      const finalImageUrls: string[] = []

      // Upload new images
      for (const img of images) {
        if (img.file) {
          // It's a new file, upload it
          const fileName = `${Date.now()}-${crypto.randomUUID()}.webp`
          const { data, error } = await supabase.storage
            .from('google_play')
            .upload(fileName, img.file, {
              cacheControl: '3600',
              upsert: false
            })

          if (error) throw error

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('google_play')
            .getPublicUrl(fileName)

          finalImageUrls.push(publicUrl)
        } else {
          // Existing image
          finalImageUrls.push(img.url)
        }
      }

      // Prepare post data
      const postPayload = {
        id: post?.id, // undefined if new
        title: (document.getElementById("title") as HTMLInputElement).value,
        content: (document.getElementById("content") as HTMLTextAreaElement).value,
        googleGroupUrl: (document.getElementById("googleGroupUrl") as HTMLInputElement).value,
        playStoreUrl: (document.getElementById("playStoreUrl") as HTMLInputElement).value,
        tags: defaultTags, // In a real form we'd bind this state too
        images: finalImageUrls
      }

      console.log("Submitting post payload:", postPayload)

      // Mock save delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      alert("Images uploaded & Payload ready! Check console for details.")

    } catch (err: any) {
      console.error("Upload error:", err)
      setErrorMsg(err.message || "Failed to upload images or save post.")
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
          <Button className="gap-2" onClick={handlePublishObj} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
            {(!isEditing && !isSubmitting) && "Publish"}
            {(isEditing && !isSubmitting) && "Save changes"}
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEditing ? "Edit post" : "Create a post"}
          </h1>
          {isNeedsFix && <Badge variant="destructive">Needs fix</Badge>}
          {isHidden && <Badge variant="secondary">Hidden</Badge>}
        </div>

        <p className="text-sm text-muted-foreground">
          {isEditing
            ? "Update your content and links. Only you (and moderators/admins) can edit this post."
            : <span>Posting as <span className="font-semibold text-foreground">{userName || "Guest"}</span>. Share your app to get testers.</span>}
        </p>
      </div>

      <Separator className="my-6" />

      <div className="space-y-6">
        {/* Error Alert */}
        {errorMsg && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Moderation note (only if needs fix) */}
        {isEditing && isNeedsFix && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Moderator note</AlertTitle>
            <AlertDescription>{post.moderationNote ?? "Please update the post to meet guidelines."}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Post details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                defaultValue={defaultTitle}
                placeholder="Example: Expense Splitter (Alpha testers needed)"
              />
              <p className="text-xs text-muted-foreground">
                Keep it short and specific. Mention alpha/beta/invite-only if relevant.
              </p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Description</Label>
              <Textarea
                id="content"
                defaultValue={defaultContent}
                placeholder="What should testers look for? Any device/version requirements? What feedback do you want?"
                className="min-h-[160px]"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Ask users to include device model + Android version in comments.
              </p>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Screenshots (Max 2)</Label>
              <div className="flex flex-wrap gap-4">
                {images.map((img) => (
                  <div key={img.id} className="relative h-32 w-24 overflow-hidden rounded-md border bg-muted group">
                    <img src={img.url} alt="preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 hover:bg-black/80 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {images.length < 2 && (
                  <div className="h-32 w-24">
                    <input
                      type="file"
                      id="image-upload"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      <span className="mt-2 text-xs text-muted-foreground">Add Image</span>
                    </label>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload up to 2 screenshots. They will be compressed to WebP (max 500KB each).
              </p>
            </div>

            {/* Links */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="googleGroupUrl">Google Group URL</Label>
                <Input
                  id="googleGroupUrl"
                  defaultValue={defaultGoogleGroupUrl}
                  placeholder="https://groups.google.com/g/your-group"
                />
                <p className="text-xs text-muted-foreground">
                  Users must join this first to be invited.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="playStoreUrl">Play Store URL</Label>
                <Input
                  id="playStoreUrl"
                  defaultValue={defaultPlayStoreUrl}
                  placeholder="https://play.google.com/store/apps/details?id=com.example.app"
                />
                <p className="text-xs text-muted-foreground">
                  Must be a valid Play Store listing URL.
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Tags</Label>
                <Button variant="outline" size="sm" className="gap-2">
                  <Info className="h-4 w-4" />
                  Tips
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Selected tags UI (static demo) */}
                {defaultTags.length > 0 ? (
                  defaultTags.map((t) => (
                    <Badge key={t} variant="secondary" className="gap-1">
                      {t} <X className="h-3 w-3 opacity-70" />
                    </Badge>
                  ))
                ) : (
                  <>
                    <Badge variant="secondary" className="gap-1">
                      Productivity <X className="h-3 w-3 opacity-70" />
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      Tools <X className="h-3 w-3 opacity-70" />
                    </Badge>
                  </>
                )}

              </div>

              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Suggested</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUGGESTED_TAGS.map((t) => (
                    <Button key={t} variant="outline" size="sm" className="rounded-full">
                      {t}
                    </Button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Keep tags relevant (2–5). Helps users find your post.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {isEditing
                ? "Changes are saved when you click “Save changes”."
                : "By publishing, you agree not to share malware or misleading links."}
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto" asChild disabled={isSubmitting}>
                <Link href={backHref}>Cancel</Link>
              </Button>
              <Button className="w-full sm:w-auto gap-2" onClick={handlePublishObj} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditing ? <Save className="h-4 w-4" /> : null)}
                {(!isEditing && !isSubmitting) && "Publish"}
                {(isEditing && !isSubmitting) && "Save changes"}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Preview card (UI only) - Show in create mode */}
        {!isEditing && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border p-4">
                <div className="text-xs text-muted-foreground">How it will look in the feed</div>
                <div className="mt-2 text-base font-semibold">
                  Expense Splitter (Alpha testers needed)
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Join the Google Group first, then install from Play Store. Please report rounding issues.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(images.length > 0) ? (
                    <div className="relative h-48 w-full overflow-hidden rounded-md bg-muted">
                      <img src={images[0].url} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-20 w-full rounded-md border border-dashed bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Badge variant="secondary">Finance</Badge>
                    <Badge variant="secondary">Tools</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone - Show in edit mode */}
        {isEditing && (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base">Danger zone</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Deleting a post will remove it from the feed. (In the real app this should be soft-delete.)
            </CardContent>
            <CardFooter className="flex items-center justify-end gap-2">
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete post
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
