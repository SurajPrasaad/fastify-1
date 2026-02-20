
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

export interface IPost {
    id: string;
    userId: string;
    content: string;
    mediaUrl?: string;
    type: 'TEXT' | 'IMAGE' | 'VIDEO';
    createdAt: string;
    updatedAt: string;
    user: IUser;
    stats: IEngagementStats;
    isLiked?: boolean;
    isBookmarked?: boolean;
    isReposted?: boolean;
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
