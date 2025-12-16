import Link from "next/link"
import { ShieldX } from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="flex flex-col items-center gap-2">
          <ShieldX className="h-10 w-10 text-destructive" />
          <CardTitle className="text-2xl font-semibold">
            403 — Access denied
          </CardTitle>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4 text-sm text-muted-foreground">
          You don’t have permission to access this page.
          <br />
          If you believe this is a mistake, please contact an administrator.
        </CardContent>

        <CardFooter className="flex justify-center gap-3">
          <Button asChild variant="default">
            <Link href="/posts">Go to posts</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
