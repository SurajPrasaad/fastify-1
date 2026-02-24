
export interface UserDto {
    id: string;
    username: string;
    email: string;
    name: string;
    techStack: string[];
    followersCount: number;
    followingCount: number;
    createdAt: string;
}

export interface CreateUserDto {
    username: string;
    email: string;
    name: string;
    password: string;
    techStack?: string[];
}

export interface UpdateUserDto {
    name?: string;
    username?: string;
    techStack?: string[];
    bio?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    website?: string | null;
    location?: string | null;
    phoneNumber?: string | null;
    subscriptionPlan?: "FREE" | "PREMIUM" | "PREMIUM_PRO";
    status?: "ACTIVE" | "DEACTIVATED" | "SUSPENDED" | "DELETED";
}

export interface UserProfileResponse {
    user: UserDto;
    isFollowing: boolean;
}

export interface UserPrivacyDto {
    profileVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
    followersVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
    followingVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
    activityVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
    searchVisibility: boolean;
}

export interface UpdateUserPrivacyDto {
    profileVisibility?: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
    followersVisibility?: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
    followingVisibility?: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
    activityVisibility?: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
    searchVisibility?: boolean;
}

export interface NotificationSettingsDto {
    pushNotifications: {
        likes: boolean;
        comments: boolean;
        mentions: boolean;
        follows: boolean;
        reposts: boolean;
        messages: boolean;
    };
    emailNotifications: {
        weeklySummary: boolean;
        securityAlerts: boolean;
        productUpdates: boolean;
    };
}

export interface UpdateNotificationSettingsDto {
    pushNotifications?: Partial<NotificationSettingsDto['pushNotifications']>;
    emailNotifications?: Partial<NotificationSettingsDto['emailNotifications']>;
}
