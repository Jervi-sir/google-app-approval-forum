"use client"

import React, { useState } from "react"
import imageCompression from "browser-image-compression"
import { X, Image as ImageIcon } from "lucide-react"

import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export type ImageItem = {
  id: string
  url: string
  file?: File
}

interface ScreenshotsManagerProps {
  images: ImageItem[]
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>
  maxImages?: number
  maxBytes?: number
}

export function ScreenshotsManager({
  images,
  setImages,
  maxImages = 2,
  maxBytes = 40 * 1024,
}: ScreenshotsManagerProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const compressToMaxBytes = async (file: File, maxBytes: number) => {
    let maxDim = 320
    let quality = 0.7
    let current: File = file

    for (let i = 0; i < 8; i++) {
      const compressed = await imageCompression(current, {
        maxWidthOrHeight: maxDim,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: quality as any,
      } as any)

      if (compressed.size <= maxBytes) return compressed

      current = compressed
      maxDim = Math.max(360, Math.floor(maxDim * 0.8))
      quality = Math.max(0.25, quality - 0.1)
    }

    return current
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setErrorMsg(null)

    if (images.length + files.length > maxImages) {
      setErrorMsg(`You can only upload a maximum of ${maxImages} images.`)
      e.target.value = ""
      return
    }

    const newItems: ImageItem[] = []

    for (const file of Array.from(files)) {
      try {
        const compressedFile = await compressToMaxBytes(file, maxBytes)
        const url = URL.createObjectURL(compressedFile)

        newItems.push({
          id: crypto.randomUUID(),
          url,
          file: compressedFile,
        })
      } catch (err) {
        console.error(err)
        setErrorMsg("Failed to process one or more images.")
      }
    }

    setImages((prev) => [...prev, ...newItems].slice(0, maxImages))
    e.target.value = ""
  }

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const canAddMoreImages = images.length < maxImages

  return (
    <div className="space-y-2">
      <Label>Screenshots (Max {maxImages})</Label>

      {errorMsg && (
        <Alert variant="destructive" className="mb-2">
          <Info className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}
      <div className="rounded-md border p-3 space-y-2">
        <div className="flex flex-wrap gap-4">
          {images.map((img) => (
            <div key={img.id} className="relative h-32 w-24 overflow-hidden rounded-md border bg-muted group">
              <img src={img.url} alt="preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 hover:bg-black/80 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {canAddMoreImages && (
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
          Images are compressed to WebP (target max {Math.round(maxBytes / 1024)}KB each). If upload fails, reduce image complexity.
        </p>
      </div>
    </div>
  )
}
