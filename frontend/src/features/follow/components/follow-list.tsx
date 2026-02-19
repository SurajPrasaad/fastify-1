"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useFollowers, useFollowing } from "../hooks";
import { UserListItem } from "./user-list-item";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowListProps {
    username: string;
    type: "followers" | "following";
}

export function FollowList({ username, type }: FollowListProps) {
    const { ref, inView } = useInView();

    const hook = type === "followers" ? useFollowers : useFollowing;
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError
    } = hook(username);

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, fetchNextPage]);

    if (isLoading) {
        return (
            <div className="flex flex-col">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-4 px-4 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-muted rounded" />
                            <div className="h-3 w-24 bg-muted rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                Failed to load {type}.
            </div>
        );
    }

    const users = data?.pages.flatMap(page => page) || [];

    if (users.length === 0) {
        return (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
                    <span className="text-2xl">👥</span>
                </div>
                <h3 className="font-semibold text-lg">
                    {type === "followers" ? "No followers yet" : "Not following anyone"}
                </h3>
                <p className="text-muted-foreground text-sm max-w-[250px]">
                    {type === "followers"
                        ? "When people follow, they'll show up here."
                        : "Start following people to see their posts."}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col divide-y">
            {users.map((user) => (
                <UserListItem key={user.id} user={user} />
            ))}

            {/* Infinite Scroll Trigger */}
            <div ref={ref} className="py-4 flex justify-center">
                {isFetchingNextPage && (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                )}
            </div>
        </div>
    );
}
