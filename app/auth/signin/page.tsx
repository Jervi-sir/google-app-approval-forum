"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Chrome, ShieldCheck } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Suspense } from "react"

function SignInContent() {
  const searchParams = useSearchParams()
  const next = searchParams.get("redirect") || "/posts"

  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>
          Sign in with Google to post apps, comment, like, and save.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-medium text-foreground">Why sign in?</div>
              <div className="mt-1">
                It helps reduce spam and makes the community more trustworthy.
              </div>
            </div>
          </div>
        </div>

        <Button className="w-full gap-2" variant={"secondary"} onClick={handleLogin}>
          <Chrome className="h-4 w-4" />
          Continue with Google
        </Button>

        <div className="text-center text-xs text-muted-foreground">
          By continuing, you agree not to post malicious or misleading links.
        </div>

        <Separator />

        <div className="text-sm text-muted-foreground">
          <span>Just browsing?</span>{" "}
          <Link href="/posts" className="font-medium text-foreground hover:underline underline-offset-4">
            View posts
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-1px)] w-full max-w-md items-center px-4 py-10">
      <Suspense fallback={<div>Loading...</div>}>
        <SignInContent />
      </Suspense>
    </div>
  )
}
