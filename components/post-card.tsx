import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { FeedPost } from '@/utils/types';
import Link from 'next/link';
import { Bookmark, Heart, MessageSquare, ShieldCheck } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export const PostCard = ({ post }: { post: FeedPost }) => {
  return (
    <>
      <Card key={post.id} className="overflow-hidden">
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                <Link
                  href={`/posts/${post.id}`}
                  className="hover:underline underline-offset-4"
                >
                  {post.title}
                </Link>
              </CardTitle>

              <CardDescription className="flex flex-wrap items-center gap-2">
                <span>
                  by{" "}
                  <Link
                    href={`/users/${post.author.id}`}
                    className="font-medium text-foreground hover:underline underline-offset-4"
                  >
                    {post.author.name}
                  </Link>
                </span>

                {post.author.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs text-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    Verified
                  </span>
                )}

                <span className="text-xs text-muted-foreground">
                  • {new Date(post.createdAt).toLocaleString()}
                </span>

                {post.moderationStatus === "needs_fix" && (
                  <Badge variant="destructive" className="ml-1">
                    Needs fix
                  </Badge>
                )}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" disabled>
                <Bookmark className="h-4 w-4" />
                Save
              </Button>
              <Button size="sm" asChild>
                <Link href={`/posts/show/${post.id}`}>Open</Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90">{post.content}</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Play Store</div>
              <div className="truncate text-sm font-medium">{post.playStoreUrl}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Google Group</div>
              <div className="truncate text-sm font-medium">{post.googleGroupUrl}</div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-4 w-4" /> {post.counts.likes}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-4 w-4" /> {post.counts.comments}
            </span>
            <span className="inline-flex items-center gap-1">
              <Bookmark className="h-4 w-4" /> {post.counts.saves}
            </span>
          </div>

          <Button variant="ghost" size="sm" asChild>
            <Link href={`/posts/show/${post.id}`}>View details</Link>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
};