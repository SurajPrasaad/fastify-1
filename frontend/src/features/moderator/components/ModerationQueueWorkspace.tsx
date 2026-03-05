"use client";

import React, { useState, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowUpRight,
  Clock,
  Flag,
  User,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Inbox,
  AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type QueueVariant = "ALL" | "HIGH_RISK" | "LOW_RISK" | "AUTO_FLAGGED" | "USER_REPORTED" | "ESCALATED";

const VARIANT_META: Record<QueueVariant, { title: string; subtitle: string }> = {
  ALL: { title: "Moderation Queue", subtitle: "All pending content, sorted by risk" },
  HIGH_RISK: { title: "High Risk Queue", subtitle: "Elevated AI risk or multiple reports" },
  LOW_RISK: { title: "Low Risk Queue", subtitle: "Minimal risk signals" },
  AUTO_FLAGGED: { title: "Auto-Flagged", subtitle: "Content flagged by AI or rules" },
  USER_REPORTED: { title: "User Reported", subtitle: "Reported by community" },
  ESCALATED: { title: "Escalated Cases", subtitle: "Senior review required" },
};

function formatTimeAgo(createdAt: string | Date): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function RiskBadge({ score }: { score: number }) {
  const level =
    score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
  const variant =
    level === "CRITICAL"
      ? "destructive"
      : level === "HIGH"
        ? "default"
        : level === "MEDIUM"
          ? "secondary"
          : "outline";
  return (
    <Badge variant={variant} className="text-xs">
      {level} · {Math.round(score)}
    </Badge>
  );
}

type QueueItem = {
  id: string;
  content: string;
  codeSnippet: string | null;
  language: string | null;
  mediaUrls: string[];
  status: string;
  riskScore: number;
  createdAt: Date | string;
  author: { id: string; username: string; name: string; avatarUrl: string | null };
  reportsCount: number;
};

export function ModerationQueueWorkspace({ variant }: { variant: QueueVariant }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<QueueItem | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [justification, setJustification] = useState("");
  const [policyRef, setPolicyRef] = useState("");
  const [reportCategory, setReportCategory] = useState<string>("SPAM");
  const [confirmAction, setConfirmAction] = useState<{ postId: string; action: "APPROVE" | "REJECT" | "REQUEST_REVISION" | "ESCALATE" | "FLAG" | "REPORT" } | null>(null);

  const limit = 50;
  const queueQuery = trpc.moderation.getQueue.useQuery(
    { limit, variant },
    { refetchInterval: autoRefresh ? 15_000 : false }
  );
  const statsQuery = trpc.moderation.getQueueStats.useQuery(undefined, { refetchInterval: autoRefresh ? 30_000 : false });
  const lockPost = trpc.moderation.lockPost.useMutation();
  const unlockPost = trpc.moderation.unlockPost.useMutation();
  const moderate = trpc.moderation.moderate.useMutation();
  const bulkModerate = trpc.moderation.bulkModerate.useMutation();
  const createReport = trpc.moderation.createReport.useMutation();
  const postHistory = trpc.moderation.getPostHistory.useQuery(
    { postId: selectedPost?.id ?? "" },
    { enabled: !!selectedPost?.id }
  );
  const postReports = trpc.moderation.getPostReports.useQuery(
    { postId: selectedPost?.id ?? "" },
    { enabled: !!selectedPost?.id }
  );

  const filtered = (queueQuery.data ?? []) as unknown as QueueItem[];
  const stats = statsQuery.data;

  const handleBulkAction = useCallback((action: "APPROVE" | "REJECT") => {
    if (selectedIds.size === 0) return;
    bulkModerate.mutate(
      {
        postIds: Array.from(selectedIds),
        action,
        reason: `Bulk ${action.toLowerCase()} by moderator`,
      },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          queueQuery.refetch();
          statsQuery.refetch();
        },
      }
    );
  }, [selectedIds, bulkModerate, queueQuery, statsQuery]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((p) => p.id)));
  }, [filtered, selectedIds.size]);

  const openReview = useCallback((post: QueueItem) => {
    setSelectedPost(post);
    setJustification("");
    setPolicyRef("");
    setConfirmAction(null);
  }, []);

  const closeReview = useCallback(() => {
    const postId = selectedPost?.id;
    setSelectedPost(null);
    setConfirmAction(null);
    if (postId) unlockPost.mutate({ postId });
  }, [selectedPost?.id, unlockPost]);

  const handleModerate = useCallback(
    (postId: string, action: "APPROVE" | "REJECT" | "REQUEST_REVISION" | "ESCALATE" | "FLAG" | "REPORT") => {
      setConfirmAction({ postId, action });
    },
    []
  );

  const submitDecision = useCallback(() => {
    if (!confirmAction) return;
    const reason = justification.trim() || (confirmAction.action === "APPROVE" ? "Approved" : confirmAction.action === "FLAG" ? "Flagged for review" : "");
    if (!["APPROVE", "FLAG", "REPORT"].includes(confirmAction.action) && !reason) return;

    if (confirmAction.action === "REPORT") {
      createReport.mutate(
        {
          postId: confirmAction.postId,
          category: reportCategory as any,
          reason: justification,
        },
        {
          onSuccess: () => {
            setConfirmAction(null);
            setJustification("");
            setPolicyRef("");
            postReports.refetch();
          },
        }
      );
      return;
    }

    moderate.mutate(
      {
        postId: confirmAction.postId,
        action: confirmAction.action as any,
        reason: justification || (confirmAction.action === "APPROVE" ? "Approved by moderator" : ""),
        internalNote: policyRef,
      },
      {
        onSuccess: () => {
          setConfirmAction(null);
          setJustification("");
          setPolicyRef("");
          closeReview();
          queueQuery.refetch();
          statsQuery.refetch();
        },
      }
    );
  }, [confirmAction, justification, policyRef, moderate, queueQuery, statsQuery, selectedPost?.id, closeReview, createReport, reportCategory, postReports]);

  const isHighRisk = (p: QueueItem) => p.riskScore >= 80;
  const reportsCount = (p: QueueItem) => (p as QueueItem & { reportsCount?: number }).reportsCount ?? 0;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{VARIANT_META[variant].title}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{filtered.length}</span> items · {VARIANT_META[variant].subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-border"
            />
            Auto-refresh
          </label>
          <Button variant="outline" size="sm" onClick={() => queueQuery.refetch()} disabled={queueQuery.isFetching}>
            <RefreshCw className={cn("h-4 w-4", queueQuery.isFetching && "animate-spin")} />
            <span className="ml-2">Refresh</span>
          </Button>
          {stats && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Avg wait: {stats.avgWaitTimeSeconds != null ? `${Math.round(stats.avgWaitTimeSeconds)}s` : "—"}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {queueQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Inbox className="h-12 w-12 opacity-50" aria-hidden />
            <p className="text-sm font-medium">No items in this queue</p>
          </div>
        ) : (
          <div className="border-border">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-border bg-muted/50">
                <tr>
                  <th className="w-10 border-b border-border p-2">
                    <Checkbox
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="p-2 font-medium">Content</th>
                  <th className="w-24 p-2 font-medium">Author</th>
                  <th className="w-20 p-2 font-medium">Risk</th>
                  <th className="w-24 p-2 font-medium">Submitted</th>
                  <th className="w-20 p-2 font-medium">Reports</th>
                  <th className="w-28 p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr
                    key={post.id}
                    className={cn(
                      "border-b border-border transition-colors hover:bg-muted/30",
                      isHighRisk(post) && "border-l-4 border-l-mod-rejected",
                      !isHighRisk(post) && post.riskScore >= 60 && "border-l-4 border-l-mod-warning"
                    )}
                  >
                    <td className="p-2">
                      <Checkbox
                        checked={selectedIds.has(post.id)}
                        onCheckedChange={() => toggleSelect(post.id)}
                        aria-label={`Select ${post.id}`}
                      />
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="text-left flex items-start gap-2 focus:outline-none group"
                        onClick={() => openReview(post)}
                      >
                        {reportsCount(post) > 0 && (
                          <div className="mt-1 shrink-0">
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-mod-rejected/10 text-mod-rejected">
                              <Flag className="h-3 w-3 fill-current" />
                            </div>
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-semibold text-primary group-hover:underline block truncate max-w-[400px]">
                            {post.content.slice(0, 100)}
                            {post.content.length > 100 ? "…" : ""}
                          </span>
                          {reportsCount(post) > 0 && (
                            <span className="text-[10px] uppercase font-bold text-mod-rejected tracking-wider">
                              Flagged by community
                            </span>
                          )}
                        </div>
                      </button>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      <span className="truncate block font-medium">@{post.author?.username ?? "—"}</span>
                    </td>
                    <td className="p-2">
                      <RiskBadge score={post.riskScore} />
                    </td>
                    <td className="p-2 text-muted-foreground">{formatTimeAgo(post.createdAt)}</td>
                    <td className="p-2">
                      {reportsCount(post) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-mod-rejected text-xs font-medium">
                          <Flag className="h-3 w-3" /> {reportsCount(post)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-mod-approved hover:bg-mod-approved/10 hover:text-mod-approved"
                          onClick={() => handleModerate(post.id, "APPROVE")}
                          title="Quick Approve"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-mod-rejected hover:bg-mod-rejected/10 hover:text-mod-rejected"
                          onClick={() => handleModerate(post.id, "REJECT")}
                          title="Quick Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <div className="h-4 w-px bg-border mx-1" />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-[#71767B] hover:bg-muted font-bold text-xs"
                          onClick={() => openReview(post)}
                        >
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-[calc(50%+130px)] -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-6 bg-[#16181C] border border-[#2F3336] rounded-full px-6 py-3 shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-white">
                {selectedIds.size}
              </div>
              <span className="text-sm font-semibold text-[#E7E9EA]">
                {selectedIds.size === 1 ? "Item" : "Items"} Selected
              </span>
            </div>

            <div className="h-4 w-px bg-[#2F3336]" />

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#2F3336]"
                onClick={() => setSelectedIds(new Set())}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-mod-approved/10 text-mod-approved hover:bg-mod-approved/20 border border-mod-approved/20"
                onClick={() => handleBulkAction("APPROVE")}
                disabled={bulkModerate.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button
                size="sm"
                className="bg-mod-rejected/10 text-mod-rejected hover:bg-mod-rejected/20 border border-mod-rejected/20"
                onClick={() => handleBulkAction("REJECT")}
                disabled={bulkModerate.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
            </div>

            {bulkModerate.isPending && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      )}
      {/* Review panel (right drawer) */}
      <Sheet open={!!selectedPost} onOpenChange={(open) => !open && closeReview()}>
        <SheetContent side="right" className="flex flex-col w-full max-w-xl sm:max-w-xl">
          {selectedPost && (
            <>
              <SheetHeader>
                <SheetTitle>Review content</SheetTitle>
                <SheetDescription>Post by @{selectedPost.author?.username ?? "unknown"}</SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 py-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-sm whitespace-pre-wrap">{selectedPost.content}</p>
                    {selectedPost.codeSnippet && (
                      <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs font-mono">
                        {selectedPost.codeSnippet}
                      </pre>
                    )}
                    {Array.isArray(selectedPost.mediaUrls) && (selectedPost.mediaUrls as string[]).length > 0 && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <ImageIcon className="h-3.5 w-3.5" /> {(selectedPost.mediaUrls as string[]).length} media
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-[#E7E9EA]">{selectedPost.author?.name ?? selectedPost.author?.username}</span>
                    <div className="h-4 w-px bg-[#2F3336]" />
                    <RiskBadge score={selectedPost.riskScore} />
                  </div>

                  {postReports.data && postReports.data.length > 0 && (
                    <div className="rounded-xl border border-mod-rejected/20 bg-mod-rejected/5 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-mod-rejected">
                        <Flag className="h-4 w-4" />
                        <p className="text-sm font-bold uppercase tracking-wide">Community Reports ({postReports.data.length})</p>
                      </div>
                      <div className="space-y-3">
                        {postReports.data.map((report: any) => (
                          <div key={report.id} className="text-xs border-l-2 border-mod-rejected/30 pl-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-[#E7E9EA] bg-[#2F3336] px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                {report.category}
                              </span>
                              <span className="text-[#71767B]">{formatTimeAgo(report.createdAt)}</span>
                            </div>
                            <p className="text-[#E7E9EA]/80 italic">"{report.reason}"</p>
                            <p className="mt-1 text-[#71767B]">by @{report.reporter?.username || "anonymous"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {postHistory.data && postHistory.data.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-bold text-[#71767B] mb-2 uppercase tracking-widest">Moderation history</p>
                      <div className="space-y-2">
                        {postHistory.data.slice(0, 3).map((entry: any) => (
                          <div key={entry.createdAt} className="text-[11px] flex gap-2 items-start">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded font-bold uppercase",
                              entry.action === "APPROVE" ? "bg-mod-approved/10 text-mod-approved" : "bg-mod-rejected/10 text-mod-rejected"
                            )}>
                              {entry.action}
                            </span>
                            <div className="flex-1">
                              <p className="text-[#E7E9EA] opacity-70 line-clamp-1">{entry.reason}</p>
                              <span className="text-[#71767B]">{formatTimeAgo(entry.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="space-y-4 border-t border-border pt-4">
                <div>
                  <Label htmlFor="justification">Justification (required for Reject / Escalate / Request Revision)</Label>
                  <Textarea
                    id="justification"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Reason for decision..."
                    className="mt-1 min-h-[80px]"
                    maxLength={2000}
                  />
                </div>
                <div>
                  <Label htmlFor="policyRef">Policy reference (optional)</Label>
                  <Input
                    id="policyRef"
                    value={policyRef}
                    onChange={(e) => setPolicyRef(e.target.value)}
                    placeholder="e.g. Community Guidelines §2"
                    className="mt-1"
                  />
                </div>
                <SheetFooter className="flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="bg-mod-approved/10 text-mod-approved hover:bg-mod-approved/20"
                    onClick={() => handleModerate(selectedPost.id, "APPROVE")}
                    disabled={moderate.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-mod-rejected/10 text-mod-rejected hover:bg-mod-rejected/20"
                    onClick={() => handleModerate(selectedPost.id, "REJECT")}
                    disabled={moderate.isPending}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-mod-warning/10 text-mod-warning hover:bg-mod-warning/20"
                    onClick={() => handleModerate(selectedPost.id, "REQUEST_REVISION")}
                    disabled={moderate.isPending}
                  >
                    <RotateCcw className="h-4 w-4" /> Request revision
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-mod-escalated/10 text-mod-escalated hover:bg-mod-escalated/20"
                    onClick={() => handleModerate(selectedPost.id, "ESCALATE")}
                    disabled={moderate.isPending}
                  >
                    <ArrowUpRight className="h-4 w-4" /> Escalate
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-mod-rejected/10 text-mod-rejected hover:bg-mod-rejected/20"
                    onClick={() => handleModerate(selectedPost.id, "FLAG")}
                    disabled={moderate.isPending}
                  >
                    <Flag className="h-4 w-4" /> Flag
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-[#2F3336] text-[#E7E9EA] hover:bg-[#3E4144]"
                    onClick={() => handleModerate(selectedPost.id, "REPORT")}
                    disabled={createReport.isPending}
                  >
                    <AlertTriangle className="h-4 w-4 text-mod-warning" /> Report
                  </Button>
                </SheetFooter>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmation modal */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "APPROVE"
                ? "Approve content?"
                : confirmAction?.action === "REJECT"
                  ? "Reject content?"
                  : confirmAction?.action === "REQUEST_REVISION"
                    ? "Request revision?"
                    : confirmAction?.action === "FLAG"
                      ? "Flag content?"
                      : confirmAction?.action === "REPORT"
                        ? "Report content?"
                        : "Escalate?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action !== "APPROVE" && confirmAction?.action !== "FLAG" && "Provide a justification. This may be visible to the author."}
              {confirmAction?.action === "APPROVE" && "This will publish the content to the feed."}
              {confirmAction?.action === "FLAG" && "This marks the post as flagged for internal review."}
              {confirmAction?.action === "REPORT" && "Submit a formal report for this content."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmAction?.action === "REPORT" && (
            <div className="py-2">
              <Label>Report Category</Label>
              <Select value={reportCategory} onValueChange={setReportCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPAM">Spam</SelectItem>
                  <SelectItem value="HARASSMENT">Harassment</SelectItem>
                  <SelectItem value="HATE_SPEECH">Hate Speech</SelectItem>
                  <SelectItem value="INAPPROPRIATE">Inappropriate</SelectItem>
                  <SelectItem value="CHILD_SAFETY">Child Safety</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {(confirmAction?.action === "REJECT" || confirmAction?.action === "REQUEST_REVISION" || confirmAction?.action === "ESCALATE" || confirmAction?.action === "FLAG" || confirmAction?.action === "REPORT") && (
            <div className="py-2">
              <Label>{confirmAction?.action === "FLAG" ? "Internal Note" : "Justification"}</Label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Required..."
                className="mt-1 min-h-[60px]"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitDecision}
              disabled={
                moderate.isPending ||
                createReport.isPending ||
                (["REJECT", "REQUEST_REVISION", "ESCALATE", "REPORT"].includes(confirmAction?.action || "") && !justification.trim())
              }
            >
              {(moderate.isPending || createReport.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

