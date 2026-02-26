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

const formatValue = (value: number) => {
    if (!value) return "";
    if (value >= 1000000) return (value / 1000000).toFixed(1).replace(/\.0$/, '') + "M";
    if (value >= 1000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + "k";
    return value.toString();
};

const AnimatedCounter = ({ value, active, activeColor }: { value: number; active?: boolean; activeColor?: string }) => (
    <span className={cn(
        "text-[13px] transition-all tabular-nums min-w-[12px]",
        active ? activeColor : "text-gray-500"
    )}>
        {formatValue(value)}
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
            color: "group-hover:text-blue-500",
            bg: "group-hover:bg-blue-500/10",
            onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                onCommentClick?.();
            }
        },
        {
            icon: Repeat2,
            count: post.repostsCount,
            color: "group-hover:text-green-500",
            bg: "group-hover:bg-green-500/10",
        },
        {
            icon: Heart,
            count: likesCount,
            active: isLiked,
            color: "group-hover:text-red-500",
            bg: "group-hover:bg-red-500/10",
            activeColor: "text-red-500",
            onClick: handleLikeClick
        },
        {
            icon: Bookmark,
            count: post.stats?.bookmarkCount,
            color: "group-hover:text-blue-500",
            bg: "group-hover:bg-blue-500/10",
        }
    ];

    return (
        <div className="flex items-center justify-between py-1 -ml-2 max-w-md w-full">
            {actions.map((action, idx) => (
                <div
                    key={idx}
                    onClick={action.onClick}
                    className="group flex items-center cursor-pointer transition-colors"
                >
                    <div className={cn(
                        "p-2 rounded-full transition-all duration-200",
                        action.bg,
                        action.active ? action.activeColor : "text-gray-500",
                        action.color
                    )}>
                        <action.icon
                            className={cn(
                                "h-[19px] w-[19px]",
                                action.active && "fill-current"
                            )}
                        />
                    </div>
                    <AnimatedCounter
                        value={action.count || 0}
                        active={action.active}
                        activeColor={action.activeColor}
                    />
                </div>
            ))}

            <div className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition-all mr-2 cursor-pointer">
                <Share2 className="h-[19px] w-[19px]" />
            </div>
        </div>
    );
});

PostActions.displayName = 'PostActions';
