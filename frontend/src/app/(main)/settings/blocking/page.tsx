"use client";

import { useEffect } from "react";
import { useBlock } from "@/features/block/hooks";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldOff, Loader2, UserX } from "lucide-react";
import { useBlockStore } from "@/features/block/store";

export default function SettingsBlockingPage() {
    const { fetchBlockedUsers, isLoading, unblock } = useBlock();
    const blockedUsers = useBlockStore((state) => state.blockedUsersList);

    useEffect(() => {
        fetchBlockedUsers();
    }, [fetchBlockedUsers]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold tracking-tight">Blocked Accounts</h3>
                    <p className="text-sm text-muted-foreground">
                        When you block someone, they won't be able to see your profile or posts, or message you.
                    </p>
                </div>
                <div className="bg-destructive/10 p-2 rounded-lg">
                    <ShieldOff className="h-6 w-6 text-destructive" />
                </div>
            </div>
            <Separator />

            {isLoading && blockedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading your block list...</p>
                </div>
            ) : blockedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed bg-muted/30">
                    <div className="p-4 rounded-full bg-muted mb-4">
                        <UserX className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h4 className="text-lg font-semibold">No blocked users</h4>
                    <p className="text-sm text-muted-foreground text-center max-w-xs mt-1">
                        Anyone you block will appear here. You haven't blocked anyone yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                        Blocked Accounts ({blockedUsers.length})
                    </p>
                    <div className="rounded-xl border bg-card divide-y overflow-hidden shadow-sm">
                        {blockedUsers.map((user) => (
                            <div key={user.id} className="group flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 border">
                                        <AvatarImage src={user.avatarUrl || undefined} />
                                        <AvatarFallback className="bg-primary/5 text-primary">
                                            {user.name?.[0] || user.username?.[0] || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-bold leading-none">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => unblock(user.id)}
                                    className="h-8 text-xs font-semibold hover:bg-destructive hover:text-destructive-foreground transition-all"
                                >
                                    Unblock
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
