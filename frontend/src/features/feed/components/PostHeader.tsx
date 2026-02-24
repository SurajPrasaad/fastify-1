import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedPost } from "../types/feed.types";
import Link from "next/link";

interface PostHeaderProps {
    post: FeedPost;
}

export const PostHeader = ({ post }: PostHeaderProps) => {
    const author = post.author || post.user;

    if (!author) return null;

    return (
        <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
                <Link href={`/profile/${author.username}`}>
                    <Avatar className="h-12 w-12 hover:opacity-80 transition-opacity ring-2 ring-transparent hover:ring-blue-500/10">
                        <AvatarImage src={author.avatarUrl || undefined} alt={author.username} />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
                            {author.username[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex flex-col">
                    <div className="flex items-center gap-1 group/name">
                        <Link href={`/profile/${author.username}`} className="font-bold text-[16px] hover:underline leading-tight decoration-2 underline-offset-2">
                            {author.name || author.username}
                        </Link>
                        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-blue-500 fill-current" aria-label="Verified account">
                            <g><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.97-.81-4.08s-2.47-1.49-4.08-1.01c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.48-2.98-.1-4.08.81s-1.49 2.48-1.01 4.08c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.21 2.97.8 4.08s2.47 1.49 4.08 1.01c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.33-2.19c1.4.48 2.98.1 4.08-.81s1.49-2.48 1.01-4.08c1.32-.67 2.19-1.91 2.19-3.34zM11.09 17.55l-4.41-4.73 1.45-1.36 2.84 3.05 6.75-7.73 1.56 1.37-8.19 9.4z"></path></g>
                        </svg>
                    </div>
                    <div className="flex items-center text-[15px] text-gray-500 dark:text-gray-400">
                        <span>@{author.username}</span>
                    </div>
                </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 -mr-2">
                <MoreHorizontal className="h-5 w-5" />
            </Button>
        </div>
    );
};
