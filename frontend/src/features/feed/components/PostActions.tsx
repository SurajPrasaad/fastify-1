import { memo } from 'react';
import {
    MessageCircle,
    Repeat2,
    Heart,
    Bookmark,
    Share2
} from 'lucide-react';
import { FeedPost } from '../types/feed.types';
import { cn } from '@/lib/utils';
import { useToggleLike } from '@/features/interaction/hooks';

interface PostActionsProps {
    post: FeedPost;
    onCommentClick?: () => void;
}

const AnimatedCounter = ({ value }: { value: number }) => (
    <span className="text-[13px] font-medium transition-all tabular-nums min-w-[12px]">
        {value > 0 ? value : ""}
    </span>
);

export const PostActions = memo(({ post, onCommentClick }: PostActionsProps) => {
    const { isLiked, count: likesCount, toggleLike } = useToggleLike(
        post.isLiked || false,
        post.likesCount || 0
    );

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleLike(post.id, "POST");
    };

    const actions = [
        {
            icon: MessageCircle,
            count: post.commentsCount,
            color: "hover:text-blue-500",
            bg: "hover:bg-blue-500/10",
            onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                onCommentClick?.();
            }
        },
        {
            icon: Repeat2,
            count: post.repostCount,
            color: "hover:text-green-500",
            bg: "hover:bg-green-500/10",
        },
        {
            icon: Heart,
            count: likesCount,
            active: isLiked,
            color: "hover:text-red-500",
            bg: "hover:bg-red-500/10",
            activeColor: "text-red-500",
            onClick: handleLikeClick
        },
        {
            icon: Bookmark,
            count: post.stats?.bookmarkCount,
            color: "hover:text-blue-500",
            bg: "hover:bg-blue-500/10",
        }
    ];

    return (
        <div className="flex items-center justify-between py-1 -ml-2 max-w-md w-full">
            {actions.map((action, idx) => (
                <button
                    key={idx}
                    onClick={action.onClick}
                    className={cn(
                        "group flex items-center space-x-1 transition-colors",
                        action.active ? action.activeColor : "text-gray-500",
                        action.color
                    )}
                >
                    <div className={cn(
                        "p-2 rounded-full transition-all duration-200",
                        action.bg
                    )}>
                        <action.icon
                            className={cn(
                                "h-[19px] w-[19px]",
                                action.active && "fill-current"
                            )}
                        />
                    </div>
                    <AnimatedCounter value={action.count || 0} />
                </button>
            ))}

            <button className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition-all mr-2">
                <Share2 className="h-[19px] w-[19px]" />
            </button>
        </div>
    );
});

PostActions.displayName = 'PostActions';
