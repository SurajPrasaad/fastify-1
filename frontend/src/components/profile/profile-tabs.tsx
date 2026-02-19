"use client";

import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface ProfileTabsProps {
    username: string;
}

export function ProfileTabs({ username }: ProfileTabsProps) {
    // We use pathname to control the 'active' state, allowing deep linking
    const pathname = usePathname();

    // Determine active tab based on path suffix
    let activeTab = "posts";
    if (pathname.endsWith("/posts")) activeTab = "posts";
    // if (pathname.endsWith("/media")) activeTab = "media";
    if (pathname.endsWith("/likes")) activeTab = "likes";
    if (pathname.endsWith("/replies")) activeTab = "replies";

    return (
        <div className="w-full">
            <Tabs value={activeTab} className="w-full">
                <TabsList className="w-full justify-start h-12 bg-transparent border-b rounded-none p-0 space-x-6">
                    <Link href={`/${username}/posts`} className="h-full">
                        <TabsTrigger
                            value="posts"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 disabled:opacity-50"
                        >
                            Posts
                        </TabsTrigger>
                    </Link>
                    <Link href={`/${username}/replies`} className="h-full">
                        <TabsTrigger
                            value="replies"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 disabled:opacity-50"
                        >
                            Replies
                        </TabsTrigger>
                    </Link>
                    {/* <Link href={`/${username}/media`} className="h-full">
                        <TabsTrigger
                            value="media"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 disabled:opacity-50"
                        >
                            Media
                        </TabsTrigger>
                    </Link> */}
                    <Link href={`/${username}/likes`} className="h-full">
                        <TabsTrigger
                            value="likes"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 disabled:opacity-50"
                        >
                            Likes
                        </TabsTrigger>
                    </Link>
                </TabsList>
            </Tabs>
        </div>
    );
}
