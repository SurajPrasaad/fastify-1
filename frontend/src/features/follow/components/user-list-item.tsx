"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowUser } from "../types";
import { FollowButton } from "./follow-button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface UserListItemProps {
    user: FollowUser;
}

export function UserListItem({ user }: UserListItemProps) {
    const { user: currentUser } = useAuth();

    // Memoize initials for performance
    const initials = useMemo(() =>
        user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
        [user.name]
    );

    const isMe = currentUser?.id === user.id;

    return (
        <div className="flex items-center justify-between py-4 px-4 hover:bg-muted/50 transition-colors group">
            <Link href={`/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10 border shrink-0">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                        <span className="font-semibold text-sm truncate">{user.name}</span>
                        {/* Verified badge placeholder if needed */}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">@{user.username}</span>
                    {user.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-[300px]">
                            {user.bio}
                        </p>
                    )}
                </div>
            </Link>

            <div className="ml-4 shrink-0 flex items-center gap-2">
                {!isMe && (
                    <FollowButton
                        userId={user.id}
                        username={user.username}
                        isFollowing={user.isFollowing}
                        isSelf={user.isSelf}
                    />
                )}
            </div>
        </div>
    );
}
