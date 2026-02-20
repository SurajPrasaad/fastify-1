import { Heart, MessageCircle, Repeat, Bookmark, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FeedPost } from "../types/feed.types";
import { useFeed } from "../hooks/useFeed";

interface PostActionsProps {
    post: FeedPost;
}

const AnimatedCounter = ({ value }: { value: number }) => (
    <AnimatePresence mode="wait">
        <motion.span
            key={value}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="text-xs font-medium text-gray-500 min-w-[12px]"
        >
            {value > 0 ? value : ""}
        </motion.span>
    </AnimatePresence>
);

export const PostActions = ({ post }: PostActionsProps) => {
    const { like, unlike, bookmark, unbookmark } = useFeed();

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (post.stats.isLiked) {
            unlike(post.id);
        } else {
            like(post.id);
        }
    };

    const handleBookmark = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (post.stats.isBookmarked) {
            unbookmark(post.id);
        } else {
            bookmark(post.id);
        }
    };

    return (
        <div className="flex items-center justify-between max-w-md pt-2">
            <button
                className="group flex items-center space-x-1.5 text-gray-500 hover:text-blue-500 transition-colors"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-2 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 rounded-full transition-colors">
                    <MessageCircle className="h-[18px] w-[18px]" />
                </div>
                <AnimatedCounter value={post.stats.commentCount} />
            </button>

            <button
                className={cn(
                    "group flex items-center space-x-1.5 transition-colors",
                    post.stats.isReposted ? "text-green-500" : "text-gray-500 hover:text-green-500"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-2 group-hover:bg-green-50 dark:group-hover:bg-green-900/20 rounded-full transition-colors">
                    <Repeat className="h-[18px] w-[18px]" />
                </div>
                <AnimatedCounter value={post.stats.repostCount} />
            </button>

            <button
                className={cn(
                    "group flex items-center space-x-1.5 transition-colors",
                    post.stats.isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                )}
                onClick={handleLike}
            >
                <motion.div
                    whileTap={{ scale: 1.4 }}
                    className="p-2 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 rounded-full transition-colors"
                >
                    <Heart className={cn("h-[18px] w-[18px]", post.stats.isLiked && "fill-current")} />
                </motion.div>
                <AnimatedCounter value={post.stats.likeCount} />
            </button>

            <div className="flex items-center">
                <button
                    className={cn(
                        "p-2 rounded-full transition-colors",
                        post.stats.isBookmarked ? "text-blue-500" : "text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    )}
                    onClick={handleBookmark}
                >
                    <Bookmark className={cn("h-[18px] w-[18px]", post.stats.isBookmarked && "fill-current")} />
                </button>
                <button className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors">
                    <Share2 className="h-[18px] w-[18px]" />
                </button>
            </div>
        </div>
    );
};
