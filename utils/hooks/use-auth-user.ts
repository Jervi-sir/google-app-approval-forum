"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/supabase-js"

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // 1) initial fetch
    supabase.auth.getUser().then(({ data, error }) => {
      setUser(error ? null : data.user ?? null)
      setLoading(false)
    })

    // 2) keep in sync
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "Guest"

  return {
    user,
    userName,
    authorId: user?.id,
    loading,
    isAuthed: !!user,
  }
}
