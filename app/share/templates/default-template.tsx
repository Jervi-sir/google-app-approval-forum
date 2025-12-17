"use client"

import React from "react"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface DefaultTemplateProps {
  title: string
  content: string
  googleGroupUrl?: string
  playStoreUrl?: string
}

export default function DefaultTemplate({ title, content, googleGroupUrl, playStoreUrl }: DefaultTemplateProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>Join the testing program</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground whitespace-pre-wrap">
            {content}
          </div>

          <div className="space-y-3 pt-4">
            <Button
              className="w-full justify-between"
              variant="outline"
              disabled={!googleGroupUrl}
              onClick={() => googleGroupUrl && window.open(googleGroupUrl, "_blank")}
            >
              Step 1: Join Google Group
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button
              className="w-full justify-between"
              disabled={!playStoreUrl}
              onClick={() => playStoreUrl && window.open(playStoreUrl, "_blank")}
            >
              Step 2: Download on Play Store
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-center text-xs text-muted-foreground">
          Powered by Google Play Approval Community
        </CardFooter>
      </Card>
    </div>
  )
}
