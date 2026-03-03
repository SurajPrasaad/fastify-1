"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Scale, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED", "MODIFIED"] as const;
const DECISION_OPTIONS = ["APPROVED", "REJECTED", "MODIFIED"] as const;

export default function ModeratorAppealsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | "MODIFIED">("REJECTED");
  const [justification, setJustification] = useState("");
  const [policyRef, setPolicyRef] = useState("");
  const [dualConfirmReversal, setDualConfirmReversal] = useState(false);
  const [confirmTyped, setConfirmTyped] = useState("");

  const listQuery = trpc.appeals.list.useQuery({
    limit: 50,
    offset: 0,
    ...(statusFilter ? { status: statusFilter as "PENDING" | "APPROVED" | "REJECTED" | "MODIFIED" } : {}),
  });
  const pendingCountQuery = trpc.appeals.getPendingCount.useQuery();
  const appealDetail = trpc.appeals.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );
  const reviewMutation = trpc.appeals.review.useMutation({
    onSuccess: () => {
      listQuery.refetch();
      pendingCountQuery.refetch();
      setSelectedId(null);
      setDualConfirmReversal(false);
      setConfirmTyped("");
    },
  });

  const appeals = listQuery.data?.items ?? [];
  const selected = appealDetail.data;

  const isReversal = selected?.status === "PENDING" && decision === "APPROVED";

  const openReview = (id: string) => {
    setSelectedId(id);
    setJustification("");
    setPolicyRef("");
    setDecision("REJECTED");
    setDualConfirmReversal(false);
    setConfirmTyped("");
  };

  const submitReview = () => {
    if (!selectedId || !justification.trim()) return;
    if (isReversal && !dualConfirmReversal) {
      setDualConfirmReversal(true);
      return;
    }
    if (isReversal && dualConfirmReversal && confirmTyped !== "REVERSE") return;
    reviewMutation.mutate({
      appealId: selectedId,
      decision,
      justification: justification.trim(),
      ...(policyRef.trim() ? { policyReference: policyRef.trim() } : {}),
    });
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Appeals</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-mod-approved">{typeof pendingCountQuery.data === "number" ? pendingCountQuery.data : 0}</span> pending
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="text-sm text-muted-foreground">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {listQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : appeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Scale className="h-12 w-12 opacity-50" aria-hidden />
            <p className="text-sm font-medium">No appeals match the filter</p>
          </div>
        ) : (
          <div className="space-y-2">
            {appeals.map((a: { id: string; status: string; resourceType: string; resourceId: string; userMessage?: string; createdAt: string }) => (
              <button
                key={a.id}
                type="button"
                className={cn(
                  "w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/30",
                  selectedId === a.id && "ring-2 ring-primary"
                )}
                onClick={() => openReview(a.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{a.id.slice(0, 8)}…</span>
                  <Badge variant={a.status === "PENDING" ? "default" : "secondary"}>{a.status}</Badge>
                </div>
                <p className="mt-1 text-sm">
                  {a.resourceType} · {a.resourceId.slice(0, 8)}…
                </p>
                {a.userMessage && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.userMessage}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="flex max-w-xl flex-col">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Review appeal</SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1 py-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Resource</p>
                    <p className="text-sm">{selected.resourceType} · {selected.resourceId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">User message</p>
                    <p className="text-sm whitespace-pre-wrap">{selected.userMessage ?? "—"}</p>
                  </div>
                  <div>
                    <Label>Decision</Label>
                    <Select value={decision} onValueChange={(v) => setDecision(v as typeof decision)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DECISION_OPTIONS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Justification (required)</Label>
                    <Textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      className="mt-1 min-h-[80px]"
                      placeholder="Reason for decision..."
                    />
                  </div>
                  <div>
                    <Label>Policy reference (optional)</Label>
                    <Input
                      value={policyRef}
                      onChange={(e) => setPolicyRef(e.target.value)}
                      className="mt-1"
                      placeholder="e.g. Policy §2"
                    />
                  </div>
                  {isReversal && (
                    <div className="rounded-lg border border-mod-warning bg-mod-warning/10 p-3">
                      <p className="text-sm font-medium text-mod-warning">Reversing moderation decision</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        This overturns the original moderator decision. Confirm below.
                      </p>
                      {dualConfirmReversal && (
                        <div className="mt-3">
                          <Label>Type REVERSE to confirm</Label>
                          <Input
                            value={confirmTyped}
                            onChange={(e) => setConfirmTyped(e.target.value)}
                            placeholder="REVERSE"
                            className="mt-1 font-mono"
                            autoComplete="off"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
              <SheetFooter>
                <Button variant="outline" onClick={() => setSelectedId(null)}>Cancel</Button>
                <Button
                  onClick={submitReview}
                  disabled={
                    reviewMutation.isPending ||
                    !justification.trim() ||
                    (isReversal && dualConfirmReversal && confirmTyped !== "REVERSE")
                  }
                >
                  {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
