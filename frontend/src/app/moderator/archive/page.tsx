"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const HARD_DELETE_CONFIRM_TEXT = "PERMANENTLY DELETE";

export default function ModeratorArchivePage() {
  const [search, setSearch] = useState("");
  const [hardDeleteTarget, setHardDeleteTarget] = useState<{ id: string; typed: string } | null>(null);

  const listQuery = trpc.admin.posts.list.useQuery(
    {
      limit: 50,
      offset: 0,
      status: ["REMOVED", "ARCHIVED"],
      ...(search.trim() ? { search: search.trim() } : {}),
    },
    { retry: (_, err) => (err as { data?: { code?: string } })?.data?.code !== "FORBIDDEN" }
  );

  const posts = (listQuery.data ?? []) as Array<{
    id: string;
    content?: string;
    status?: string;
    createdAt?: string;
    author?: { username?: string; name?: string };
  }>;
  const isForbidden = (listQuery.error as { data?: { code?: string } })?.data?.code === "FORBIDDEN";

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Archived Content</h1>
          <p className="text-sm text-muted-foreground">Removed and archived posts</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isForbidden && (
          <div className="rounded-lg border border-mod-warning bg-mod-warning/10 p-4 text-center text-sm text-muted-foreground">
            You don’t have permission to view archived content. Contact an administrator.
          </div>
        )}
        {!isForbidden && listQuery.isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        )}
        {!isForbidden && !listQuery.isLoading && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Archive className="h-12 w-12 opacity-50" aria-hidden />
            <p className="text-sm font-medium">No archived content</p>
          </div>
        )}
        {!isForbidden && !listQuery.isLoading && posts.length > 0 && (
          <div className="space-y-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{post.content?.slice(0, 120) ?? "—"}…</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary">{post.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      @{post.author?.username ?? "—"} · {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" disabled title="Restore (admin only)">
                    <RotateCcw className="h-4 w-4" /> Restore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setHardDeleteTarget({ id: post.id, typed: "" })}
                    disabled
                    title="Hard delete (Super Admin only)"
                  >
                    Hard delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!hardDeleteTarget} onOpenChange={(open) => !open && setHardDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanent deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Type <strong>{HARD_DELETE_CONFIRM_TEXT}</strong> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={hardDeleteTarget?.typed ?? ""}
            onChange={(e) => setHardDeleteTarget((p) => (p ? { ...p, typed: e.target.value } : null))}
            placeholder={HARD_DELETE_CONFIRM_TEXT}
            className="font-mono"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={hardDeleteTarget?.typed !== HARD_DELETE_CONFIRM_TEXT}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
