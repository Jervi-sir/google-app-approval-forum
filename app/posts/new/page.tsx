import { PostForm } from "@/components/post-form"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export default async function NewPostPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  const userName = user?.user_metadata?.full_name || user?.email || "Guest"

  return <PostForm userName={userName} />
}
