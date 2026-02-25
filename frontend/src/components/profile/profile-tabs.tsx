"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/features/auth/hooks';

interface ProfileTabsProps {
    username: string;
}

const TABS = [
    { label: "Posts", id: "posts" },
    { label: "Replies", id: "replies" },
    { label: "Bookmarks", id: "bookmarks" },
    { label: "Likes", id: "likes" },
];

export function ProfileTabs({ username }: ProfileTabsProps) {
    const pathname = usePathname();
    const { data: currentUser } = useCurrentUser();
    const isOwner = currentUser?.username === username;

    const filteredTabs = TABS.filter(tab => {
        if (tab.id === "bookmarks") return isOwner;
        return true;
    });

    const getActiveTab = () => {
        if (pathname.endsWith("/replies")) return "replies";
        if (pathname.endsWith("/bookmarks")) return "bookmarks";
        if (pathname.endsWith("/likes")) return "likes";
        return "posts";
    };

    const activeTab = getActiveTab();

    return (
        <div className="flex border-b border-slate-200 dark:border-slate-800">
            {filteredTabs.map((tab) => (
                <Link
                    key={tab.id}
                    href={`/${username}/${tab.id === 'posts' ? '' : tab.id}`}
                    className={cn(
                        "flex-1 py-4 text-sm relative text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors uppercase tracking-wider",
                        activeTab === tab.id
                            ? "font-bold text-slate-900 dark:text-slate-100"
                            : "font-medium text-slate-500"
                    )}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full animate-in fade-in duration-300" />
                    )}
                </Link>
            ))}
        </div>
    );
}
