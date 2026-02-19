"use client";

import { useSocial } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface FollowButtonProps {
    userId: string;
    username: string;
    isFollowing: boolean;
    isSelf: boolean;
    className?: string;
    onToggle?: () => void;
}

export function FollowButton({ userId, username, isFollowing: initialIsFollowing, isSelf, className, onToggle }: FollowButtonProps) {
    const { follow, unfollow, isFollowing: isPendingFollow, isUnfollowing: isPendingUnfollow } = useSocial(userId, username);
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

    // Sync state with prop if it changes externally
    useEffect(() => {
        setIsFollowing(initialIsFollowing);
    }, [initialIsFollowing]);

    if (isSelf) return null;

    const isLoading = isPendingFollow || isPendingUnfollow;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return;

        if (isFollowing) {
            // Optimistic update
            setIsFollowing(false);
            unfollow(undefined, {
                onSuccess: () => onToggle?.(),
                onError: () => setIsFollowing(true) // Revert on error
            });
        } else {
            // Optimistic update
            setIsFollowing(true);
            follow(undefined, {
                onSuccess: () => onToggle?.(),
                onError: () => setIsFollowing(false) // Revert on error
            });
        }
    };

    return (
        <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            className={cn(
                "w-24 transition-all duration-200 group",
                isFollowing
                    ? "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                    : "",
                className
            )}
            onClick={handleClick}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    <span className="group-hover:hidden">Following</span>
                    <span className="hidden group-hover:inline">Unfollow</span>
                </>
            ) : (
                "Follow"
            )}
        </Button>
    );
}

// Note: Hook "Following" text replacement on hover needs CSS or state.
// "Following" -> "Unfollow" on hover logic requires state or CSS group-hover.
// Simple "Following" is fine for now as per requirement 3 ("Following (neutral style)").
// User required: "Follow back (highlighted state)" - needs logic to know if they follow me. Backend doesn't provide "followsViewer" yet, only "viewerFollows".
// "Follow back" is for when they follow me but I don't follow them.
// I'll stick to basic Follow/Following for now.
