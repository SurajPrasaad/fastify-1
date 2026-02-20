"use client";

import React from "react";
import { useBlock } from "../hooks";
import { AlertCircle, Ban } from "lucide-react";

interface BlockGuardProps {
    userId: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function BlockGuard({ userId, children, fallback }: BlockGuardProps) {
    const { isBlocked, isBlockedBy } = useBlock(userId);

    if (isBlocked) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg border border-dashed border-destructive/50 gap-3">
                <Ban className="h-8 w-8 text-destructive" />
                <div className="text-center">
                    <p className="font-semibold text-destructive">You have blocked this user</p>
                    <p className="text-sm text-muted-foreground">Unblock them to resume conversation.</p>
                </div>
                {fallback}
            </div>
        );
    }

    if (isBlockedBy) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-lg gap-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                    You cannot message this user.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
