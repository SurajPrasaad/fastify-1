
export enum ResourceType {
    POST = 'POST',
    COMMENT = 'COMMENT'
}

export enum ReactionType {
    HEART = 'HEART',
    LAUGH = 'LAUGH',
    SAD = 'SAD',
    ANGRY = 'ANGRY',
    WOW = 'WOW'
}

export interface IUser {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
}

export interface IEngagementStats {
    likeCount: number;
    commentCount: number;
    repostCount: number;
    bookmarkCount?: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
    isReposted?: boolean;
}

export interface IPollOption {
    id: string;
    text: string;
    votesCount: number;
}

export interface IPoll {
    id: string;
    question: string;
    options: IPollOption[];
    expiresAt: string;
    userVotedOptionId?: string | null;
}

export interface IPost {
    id: string;
    userId: string;
    content: string;
    mediaUrl?: string;
    mediaUrls?: string[];
    type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'POLL';
    createdAt: string;
    updatedAt: string;
    user: IUser;
    author?: IUser;
    stats: IEngagementStats;
    isLiked?: boolean;
    isBookmarked?: boolean;
    isReposted?: boolean;
    pollId?: string | null;
    poll?: IPoll | null;
    originalPostId?: string | null;
    originalPost?: {
        id: string;
        content: string;
        createdAt: string;
        author: {
            username: string;
            name: string;
            avatarUrl?: string | null;
        };
    } | null;
    location?: string | null;
    likesCount: number;
    commentsCount: number;
    repostsCount: number;
}

export interface IComment {
    id: string;
    postId: string;
    userId: string;
    content: string;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
    user: IUser;
    replyCount: number;
    likeCount: number;
    isLiked?: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    nextCursor?: string;
    hasMore: boolean;
}

export interface FeedResponse extends PaginatedResponse<IPost> { }

export interface CommentResponse extends PaginatedResponse<IComment> { }
