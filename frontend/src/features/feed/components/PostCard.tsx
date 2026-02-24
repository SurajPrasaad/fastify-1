import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
    Image as ImageIcon,
    Smile,
    ListTodo,
    MapPin,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';

import { FeedPost } from '../types/feed.types';
import { PostHeader } from './PostHeader';
import { PostContent } from './PostContent';
import { PostMedia } from './PostMedia';
import { PostActions } from './PostActions';
import { PostPoll } from './PostPoll';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useCreateComment } from '@/features/interaction/hooks';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { CommentList } from '@/components/comments/comment-list';

interface PostCardProps {
    post: FeedPost;
}

export const PostCard = memo(({ post }: PostCardProps) => {
    const [isCommenting, setIsCommenting] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [refreshCounter, setRefreshCounter] = useState(0);

    const { createComment, isSubmitting } = useCreateComment();
    const { user } = useAuthStore();

    const handleComment = async () => {
        if (!commentText.trim()) return;
        try {
            await createComment(post.id, commentText, undefined, () => {
                setCommentText("");
                setRefreshCounter(prev => prev + 1);
                setIsCommenting(false);
                setShowComments(true);
                toast.success("Reply posted!");
            });
        } catch (error) {
            // Error handled by hook
        }
    };

    const toggleCommentSection = () => {
        if (!showComments) {
            setShowComments(true);
            setIsCommenting(true);
        } else {
            setShowComments(false);
            setIsCommenting(false);
        }
    };

    const formattedTime = format(new Date(post.createdAt), 'h:mm a');
    const formattedDate = format(new Date(post.createdAt), 'MMM d, yyyy');

    return (
        <motion.article
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-black transition-colors"
        >
            <div className="flex flex-col space-y-3">
                <PostHeader post={post} />

                <div className="space-y-4">
                    {/* Main Content */}
                    <div className="text-[22px] leading-tight font-normal text-black dark:text-white break-words">
                        <PostContent content={post.content} />
                    </div>

                    {post.poll && <PostPoll poll={post.poll} postId={post.id} />}
                    <PostMedia mediaUrls={post.mediaUrls} type={post.type} />

                    {/* Original Post (for Reposts) */}
                    {post.originalPost && (
                        <div className="mt-3 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                            <div className="flex items-center space-x-2 mb-2">
                                <Avatar className="size-5">
                                    <AvatarImage src={post.originalPost.author.avatarUrl || undefined} />
                                    <AvatarFallback>{post.originalPost.author.username[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-sm truncate">{post.originalPost.author.name}</span>
                                <span className="text-gray-500 text-sm truncate">@{post.originalPost.author.username}</span>
                            </div>
                            <PostContent content={post.originalPost.content} />
                        </div>
                    )}

                    {/* Metadata line */}
                    <div className="flex items-center text-[15px] text-gray-500 dark:text-gray-400 space-x-1 py-1 border-b border-gray-100 dark:border-gray-800">
                        <span>{formattedTime}</span>
                        <span>·</span>
                        <span>{formattedDate}</span>
                        <span>·</span>
                        <span className="font-bold text-black dark:text-white">1.2M</span>
                        <span>Views</span>
                    </div>

                    {/* Statistics row */}
                    <div className="flex items-center space-x-5 py-3 border-b border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar">
                        <div className="flex items-center space-x-1 whitespace-nowrap">
                            <span className="font-bold text-black dark:text-white">{post.repostCount || 0}</span>
                            <span className="text-gray-500 dark:text-gray-400">Reposts</span>
                        </div>
                        <div className="flex items-center space-x-1 whitespace-nowrap">
                            <span className="font-bold text-black dark:text-white">{post.commentsCount || 0}</span>
                            <span className="text-gray-500 dark:text-gray-400">Comments</span>
                        </div>
                        <div className="flex items-center space-x-1 whitespace-nowrap">
                            <span className="font-bold text-black dark:text-white">{post.likesCount || 0}</span>
                            <span className="text-gray-500 dark:text-gray-400">Likes</span>
                        </div>
                        <div className="flex items-center space-x-1 whitespace-nowrap">
                            <span className="font-bold text-black dark:text-white">{post.stats?.bookmarkCount || 0}</span>
                            <span className="text-gray-500 dark:text-gray-400">Bookmarks</span>
                        </div>
                    </div>

                    {/* Action buttons icon row */}
                    <PostActions
                        post={post}
                        onCommentClick={toggleCommentSection}
                    />

                    {/* Interactive Section: Reply + Comments */}
                    <div className="pt-2">
                        {isCommenting ? (
                            <div className="space-y-3 mb-6 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    <span>Replying to</span>
                                    <span className="text-blue-500">@{post.author?.username || post.user?.username}</span>
                                </div>
                                <div className="flex space-x-3">
                                    <Avatar className="h-10 w-10 shrink-0">
                                        <AvatarImage src={user?.avatarUrl || undefined} />
                                        <AvatarFallback>{user?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-3">
                                        <Textarea
                                            placeholder="Post your reply"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            className="min-h-[120px] w-full bg-transparent border-none focus-visible:ring-0 text-[20px] p-0 resize-none placeholder:text-gray-500"
                                            autoFocus
                                        />
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center -ml-2">
                                                <Button variant="ghost" size="icon" className="rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                    <ImageIcon className="h-5 w-5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                    <Smile className="h-5 w-5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                    <ListTodo className="h-5 w-5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                    <MapPin className="h-5 w-5" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                {commentText.length > 0 && (
                                                    <span className="text-xs text-muted-foreground mr-2">
                                                        {commentText.length}/280
                                                    </span>
                                                )}
                                                <Button
                                                    size="sm"
                                                    className="rounded-full px-5 font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-md disabled:opacity-50"
                                                    disabled={!commentText.trim() || isSubmitting}
                                                    onClick={handleComment}
                                                >
                                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Reply"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => {
                                    setIsCommenting(true);
                                    setShowComments(true);
                                }}
                                className="flex items-center space-x-3 text-gray-500 dark:text-gray-400 group cursor-pointer pb-4 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl p-2 transition-colors"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user?.avatarUrl || undefined} />
                                    <AvatarFallback>{user?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                                </Avatar>
                                <span className="text-[17px]">Post your reply</span>
                            </div>
                        )}

                        {/* The Actual Comment List */}
                        {showComments && (
                            <div className="border-t border-gray-100 dark:border-gray-800 mt-2">
                                <CommentList key={refreshCounter} postId={post.id} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.article>
    );
});

PostCard.displayName = 'PostCard';
