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
    techStack?: string[];
    bio?: string;
    avatarUrl?: string | null;
}
export interface UserProfileResponse {
    user: UserDto;
    isFollowing: boolean;
}
//# sourceMappingURL=user.dto.d.ts.map