"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ProfileTabsProps {
    username: string;
}

const TABS = [
    { label: "Posts", id: "posts" },
    { label: "Replies", id: "replies" },
    { label: "Media", id: "media" },
    { label: "Likes", id: "likes" },
];

export function ProfileTabs({ username }: ProfileTabsProps) {
    const pathname = usePathname();

    const getActiveTab = () => {
        if (pathname.endsWith("/replies")) return "replies";
        if (pathname.endsWith("/media")) return "media";
        if (pathname.endsWith("/likes")) return "likes";
        return "posts";
    };

    const activeTab = getActiveTab();

    return (
        <div className="flex border-b border-slate-200 dark:border-slate-800">
            {TABS.map((tab) => (
                <Link
                    key={tab.id}
                    href={`/${username}/${tab.id}`}
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
