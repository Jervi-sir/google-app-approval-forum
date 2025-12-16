import { PostForm } from "@/app/posts/upsert/post-form"
import { useAuthUser } from "@/utils/hooks/use-auth-user"

export default async function NewPostPage() {
  return <PostForm />
}
