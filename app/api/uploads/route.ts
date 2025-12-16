import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const BUCKET = "google_play"
const MAX_BYTES = 30 * 1024

function extFromMime(mime: string) {
  if (mime === "image/webp") return "webp"
  if (mime === "image/png") return "png"
  if (mime === "image/jpeg") return "jpg"
  return null
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // ✅ important

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 })
    }

    const form = await req.formData()
    const file = form.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large. Max is ${Math.round(MAX_BYTES / 1024)}KB` },
        { status: 400 }
      )
    }

    const mime = file.type || ""
    const ext = extFromMime(mime)
    if (!ext) return NextResponse.json({ error: `Unsupported file type: ${mime}` }, { status: 400 })

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })

    const path = `posts/${crypto.randomUUID()}.${ext}`

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: mime,
      upsert: false,
      cacheControl: "3600",
    })

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({ publicUrl: data.publicUrl, path })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}
