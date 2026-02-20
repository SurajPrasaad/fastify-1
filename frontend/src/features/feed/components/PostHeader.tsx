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
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <Link href={`/profile/${post.user.username}`}>
                    <Avatar className="h-10 w-10 hover:opacity-80 transition-opacity">
                        <AvatarImage src={post.user.avatarUrl} alt={post.user.username} />
                        <AvatarFallback>{post.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex flex-col">
                    <Link href={`/profile/${post.user.username}`} className="font-bold hover:underline leading-tight">
                        {post.user.name || post.user.username}
                    </Link>
                    <div className="flex items-center text-sm text-gray-500">
                        <span>@{post.user.username}</span>
                        <span className="mx-1">·</span>
                        <time>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</time>
                    </div>
                </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full text-gray-500">
                <MoreHorizontal className="h-5 w-5" />
            </Button>
        </div>
    );
};
