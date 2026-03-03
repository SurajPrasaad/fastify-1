"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  AlertTriangle,
  Menu,
  Rocket,
  LogOut,
  ChevronDown,
  ChevronLeft,
  Inbox,
  AlertCircle,
  Scale,
  Archive,
  BarChart3,
  FileText,
  Bell,
  User,
} from "lucide-react";
import { useCurrentUser } from "../../features/auth/hooks";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { useModeratorRole } from "@/features/moderator/hooks/useModeratorRole";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SIDEBAR_SECTIONS = {
  queue: { label: "Moderation Queue", icon: Inbox },
  highRisk: { label: "High-Risk Content", icon: AlertCircle },
  appeals: { label: "Appeals", icon: Scale },
  archive: { label: "Archived Content", icon: Archive },
  analytics: { label: "Analytics", icon: BarChart3 },
  logs: { label: "Activity Logs", icon: FileText },
} as const;

export default function ModeratorLayout({ children }: { readonly children: React.ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();
  const { logout, user: authUser } = useAuth();
  const { isAdmin } = useModeratorRole();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState({
    queue: true,
    reports: false,
    history: false,
    risk: false,
    workspace: true,
  });

  const appealsPending = trpc.appeals.getPendingCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const pendingCount = typeof appealsPending.data === "number" ? appealsPending.data : 0;

  const isModeratorLike =
    user && (user.auth.role === "MODERATOR" || user.auth.role === "SUPER_ADMIN");

  useEffect(() => {
    if (!isLoading && !isModeratorLike) {
      router.replace("/");
    }
  }, [isModeratorLike, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isModeratorLike) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-display">
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-border bg-card transition-all duration-200 md:flex",
          sidebarCollapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Rocket className="h-5 w-5" aria-hidden />
          </div>
          {!sidebarCollapsed && (
            <span className="truncate text-lg font-semibold tracking-tight">Mod Console</span>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          <Link
            href="/moderator"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/moderator"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" aria-hidden />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </Link>

          {/* Moderation Queue */}
          <div>
            <button
              type="button"
              onClick={() => setOpenSections((p) => ({ ...p, queue: !p.queue }))}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              aria-expanded={openSections.queue}
            >
              {!sidebarCollapsed && <span>Moderation Queue</span>}
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 transition-transform", openSections.queue && "rotate-180")}
                aria-hidden
              />
            </button>
            {openSections.queue && (
              <div className="mt-1 space-y-0.5">
                <SidebarSubLink href="/moderator/queue" label="All Pending" pathname={pathname} collapsed={sidebarCollapsed} />
                <SidebarSubLink href="/moderator/queue/high-risk" label="High Risk" pathname={pathname} collapsed={sidebarCollapsed} />
                <SidebarSubLink href="/moderator/queue/low-risk" label="Low Risk" pathname={pathname} collapsed={sidebarCollapsed} />
                <SidebarSubLink href="/moderator/queue/auto-flagged" label="Auto-Flagged" pathname={pathname} collapsed={sidebarCollapsed} />
                <SidebarSubLink href="/moderator/queue/user-reported" label="User Reported" pathname={pathname} collapsed={sidebarCollapsed} />
                <SidebarSubLink href="/moderator/queue/escalated" label="Escalated" pathname={pathname} collapsed={sidebarCollapsed} />
              </div>
            )}
          </div>

          {/* Appeals (with badge) */}
          <Link
            href="/moderator/appeals"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/moderator/appeals")
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <span className="relative inline-flex shrink-0">
              <Scale className="h-5 w-5" aria-hidden />
              {pendingCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-mod-rejected px-1 text-[10px] font-bold text-white">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </span>
            {!sidebarCollapsed && <span>Appeals</span>}
          </Link>

          {/* Archived Content (admin/moderator) */}
          <SidebarSubLink href="/moderator/archive" label="Archived Content" pathname={pathname} collapsed={sidebarCollapsed} />

          {/* Analytics */}
          <SidebarSubLink href="/moderator/analytics" label="Analytics" pathname={pathname} collapsed={sidebarCollapsed} />

          {/* Activity Logs (admin can see full logs) */}
          {isAdmin && (
            <SidebarSubLink href="/moderator/activity-logs" label="Activity Logs" pathname={pathname} collapsed={sidebarCollapsed} />
          )}

          {/* Reports */}
          <div>
            <button
              type="button"
              onClick={() => setOpenSections((p) => ({ ...p, reports: !p.reports }))}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              aria-expanded={openSections.reports}
            >
              {!sidebarCollapsed && <span>Reports</span>}
              <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", openSections.reports && "rotate-180")} />
            </button>
            {openSections.reports && (
              <div className="mt-1 space-y-0.5">
                <SidebarSubLink href="/moderator/reports/spam" label="Spam" pathname={pathname} collapsed={sidebarCollapsed} />
                <SidebarSubLink href="/moderator/reports/abuse" label="Abuse" pathname={pathname} collapsed={sidebarCollapsed} />
                <SidebarSubLink href="/moderator/reports/policy" label="Policy" pathname={pathname} collapsed={sidebarCollapsed} />
                <SidebarSubLink href="/moderator/reports/community-flags" label="Community" pathname={pathname} collapsed={sidebarCollapsed} />
              </div>
            )}
          </div>

          {/* History */}
          <div>
            <button
              type="button"
              onClick={() => setOpenSections((p) => ({ ...p, history: !p.history }))}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              aria-expanded={openSections.history}
            >
              {!sidebarCollapsed && <span>History</span>}
              <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", openSections.history && "rotate-180")} />
            </button>
            {openSections.history && (
              <div className="mt-1 space-y-0.5">
                <SidebarSubLink href="/moderator/history/approved" label="Approved" pathname={pathname} collapsed={sidebarCollapsed} />
                <SidebarSubLink href="/moderator/history/rejected" label="Rejected" pathname={pathname} collapsed={sidebarCollapsed} />
                <SidebarSubLink href="/moderator/history" label="My Activity" pathname={pathname} collapsed={sidebarCollapsed} />
              </div>
            )}
          </div>

          {/* Risk */}
          <div>
            <button
              type="button"
              onClick={() => setOpenSections((p) => ({ ...p, risk: !p.risk }))}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              aria-expanded={openSections.risk}
            >
              {!sidebarCollapsed && <span>Risk & Safety</span>}
              <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", openSections.risk && "rotate-180")} />
            </button>
            {openSections.risk && (
              <div className="mt-1 space-y-0.5">
                <SidebarSubLink href="/moderator/risk/ai-scores" label="AI Scores" pathname={pathname} collapsed={sidebarCollapsed} />
                <SidebarSubLink href="/moderator/risk/sensitive-content" label="Sensitive" pathname={pathname} collapsed={sidebarCollapsed} />
                <SidebarSubLink href="/moderator/risk/repeat-offenders" label="Repeat Offenders" pathname={pathname} collapsed={sidebarCollapsed} />
              </div>
            )}
          </div>

          <Link
            href="/moderator/notifications"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/moderator/notifications")
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Bell className="h-5 w-5 shrink-0" aria-hidden />
            {!sidebarCollapsed && <span>Notifications</span>}
          </Link>

          <Link href="/moderator/guidelines" className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            pathname === "/moderator/guidelines" && "bg-accent text-accent-foreground"
          )}>
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
            {!sidebarCollapsed && <span>Guidelines</span>}
          </Link>
        </nav>

        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-4 w-4", sidebarCollapsed && "rotate-180")} />
            {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <button type="button" className="md:hidden p-2 text-foreground" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg p-2 hover:bg-accent"
                aria-label="Moderator profile menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={authUser?.avatarUrl ?? undefined} alt="" />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {(authUser?.name ?? authUser?.username ?? "M").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline-block truncate max-w-[120px]">
                  {authUser?.name ?? authUser?.username ?? "Moderator"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/${authUser?.username ?? ""}`} className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-auto border-l border-border bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarSubLink({
  href,
  label,
  pathname,
  collapsed,
}: {
  readonly href: string;
  readonly label: string;
  readonly pathname: string;
  readonly collapsed: boolean;
}) {
  const isActive = pathname === href || (href !== "/moderator" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? label : undefined}
    >
      {collapsed ? <span className="text-xs font-medium w-6 text-center">{label.slice(0, 1)}</span> : <span>{label}</span>}
    </Link>
  );
}
