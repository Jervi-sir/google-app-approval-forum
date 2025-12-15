import { notFound } from "next/navigation"
import { PostForm, type PostData } from "@/components/post-form"

const MOCK_POSTS: Record<string, PostData> = {
  p_1: {
    id: "p_1",
    title: "Habit Tracker (Invite-only testing)",
    content:
      "Looking for testers. Please join the Google Group first, then install from Play Store.\n\nIf you can, please test on Android 11+ and report battery usage issues.",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.example.habit",
    googleGroupUrl: "https://groups.google.com/g/example-testers",
    tags: ["Productivity", "Health"],
    moderationStatus: "ok",
  },
  p_2: {
    id: "p_2",
    title: "Expense Splitter App (Alpha)",
    content:
      "Need 20 testers to validate multi-currency calculations. Join group then install.\n\nPlease report any rounding issues and screenshots if possible.",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.example.split",
    googleGroupUrl: "https://groups.google.com/g/split-alpha-testers",
    tags: ["Finance", "Tools"],
    moderationStatus: "needs_fix",
    moderationNote:
      "Your post needs a clearer testing instruction. Please explicitly state: Join group → wait 5–10 min → open Play Store link.",
  },
}

export default function EditPostPage({ params }: { params: { id: string } }) {
  const post = MOCK_POSTS[params.id]
  if (!post) notFound()

  return <PostForm post={post} />
}
