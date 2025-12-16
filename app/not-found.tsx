"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">404</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            The page you’re looking for doesn’t exist or was moved.
          </p>
        </CardContent>

        <CardFooter className="flex justify-center gap-3">
          <Button asChild variant="secondary">
            <Link href="/posts">
              <FileText className="mr-2 h-4 w-4" />
              Go to posts
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
