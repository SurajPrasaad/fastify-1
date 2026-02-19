"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface FollowTabsProps {
    username: string;
    activeTab: "followers" | "following";
}

export function FollowTabs({ username, activeTab }: FollowTabsProps) {
    return (
        <div className="flex border-b mb-2">
            <Link
                href={`/${username}/followers`}
                className={cn(
                    "flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors hover:text-foreground hover:bg-muted/50",
                    activeTab === "followers"
                        ? "border-b-2 border-primary text-foreground"
                        : "text-muted-foreground border-b-2 border-transparent"
                )}
            >
                Followers
            </Link>
            <Link
                href={`/${username}/following`}
                className={cn(
                    "flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors hover:text-foreground hover:bg-muted/50",
                    activeTab === "following"
                        ? "border-b-2 border-primary text-foreground"
                        : "text-muted-foreground border-b-2 border-transparent"
                )}
            >
                Following
            </Link>
        </div>
    );
}
