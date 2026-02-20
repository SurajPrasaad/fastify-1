
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IPost, ResourceType } from '../shared/types';
import { formatDistanceToNow } from 'date-fns';
import {
    Heart,
    MessageCircle,
    Repeat2,
    Share,
    Bookmark,
    MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEngagement } from '../shared/hooks';
import { motion, AnimatePresence } from 'framer-motion';

export function PostCard({ post }: { post: IPost }) {
    const { toggleLike, toggleBookmark } = useEngagement(post.id, post);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm hover:border-primary/20 transition-all duration-300"
        >
            <div className="flex gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-background border">
                    <AvatarImage src={post.user.avatarUrl} />
                    <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="font-bold text-sm truncate hover:underline cursor-pointer">
                                {post.user.name}
                            </span>
                            <span className="text-muted-foreground text-xs truncate">
                                @{post.user.username}
                            </span>
                            <span className="text-muted-foreground text-xs shrink-0">•</span>
                            <span className="text-muted-foreground text-xs shrink-0">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: false })}
                            </span>
                        </div>
                        <button className="text-muted-foreground hover:text-primary transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </div>

                    <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                        {post.content}
                    </p>

                    {post.mediaUrl && (
                        <div className="rounded-xl overflow-hidden border mb-3 bg-muted">
                            <img
                                src={post.mediaUrl}
                                alt="Post content"
                                className="w-full h-auto object-cover max-h-[512px]"
                                loading="lazy"
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-6">
                            <ActionButton
                                icon={Heart}
                                count={post.stats.likeCount}
                                active={post.isLiked}
                                activeColor="text-rose-500"
                                activeBg="bg-rose-500/10"
                                onClick={() => toggleLike.mutate(ResourceType.POST)}
                            />
                            <ActionButton
                                icon={MessageCircle}
                                count={post.stats.commentCount}
                                hoverColor="hover:text-sky-500"
                                hoverBg="hover:bg-sky-500/10"
                            />
                            <ActionButton
                                icon={Repeat2}
                                count={post.stats.repostCount}
                                active={post.isReposted}
                                activeColor="text-emerald-500"
                                activeBg="bg-emerald-500/10"
                            />
                            <ActionButton
                                icon={Share}
                                hoverColor="hover:text-primary"
                                hoverBg="hover:bg-primary/10"
                            />
                        </div>

                        <ActionButton
                            icon={Bookmark}
                            active={post.isBookmarked}
                            activeColor="text-amber-500"
                            activeBg="bg-amber-500/10"
                            onClick={() => toggleBookmark.mutate()}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

interface ActionButtonProps {
    icon: any;
    count?: number;
    active?: boolean;
    onClick?: () => void;
    activeColor?: string;
    activeBg?: string;
    hoverColor?: string;
    hoverBg?: string;
}

function ActionButton({
    icon: Icon,
    count,
    active,
    onClick,
    activeColor = "text-primary",
    activeBg = "bg-primary/10",
    hoverColor = "hover:text-primary",
    hoverBg = "hover:bg-primary/10"
}: ActionButtonProps) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            className={cn(
                "flex items-center gap-1.5 group transition-all duration-200",
                active ? activeColor : "text-muted-foreground",
                hoverColor
            )}
        >
            <div className={cn(
                "p-2 rounded-full transition-colors",
                active ? activeBg : "group-hover:bg-muted",
                hoverBg
            )}>
                <Icon className={cn(
                    "h-4 w-4",
                    active && "fill-current"
                )} />
            </div>
            {count !== undefined && (
                <span className="text-[11px] font-medium min-w-[12px]">
                    {count > 0 ? count : ''}
                </span>
            )}
        </button>
    );
}
