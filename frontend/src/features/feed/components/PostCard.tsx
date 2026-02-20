import { memo } from 'react';
import { FeedPost } from '../types/feed.types';
import { PostHeader } from './PostHeader';
import { PostContent } from './PostContent';
import { PostMedia } from './PostMedia';
import { PostActions } from './PostActions';
import { motion } from 'framer-motion';

interface PostCardProps {
    post: FeedPost;
}

export const PostCard = memo(({ post }: PostCardProps) => {
    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors cursor-pointer"
        >
            <div className="flex space-x-3">
                <div className="flex-1 space-y-3">
                    <PostHeader post={post} />
                    <PostContent content={post.content} />
                    <PostMedia mediaUrl={post.mediaUrl} type={post.type} />
                    <PostActions post={post} />
                </div>
            </div>
        </motion.article>
    );
});

PostCard.displayName = 'PostCard';
