import { UserResponse } from "@/types/auth";

export interface FollowUser extends UserResponse {
    isFollowing: boolean;
    isSelf: boolean;
}

export interface FollowsPage {
    users: FollowUser[];
    meta: {
        total: number;
    }
}
// Note: Backend returns array directly for now, so pagination meta is implied by array length < limit?
// Or did I wrap it?
// UserRepository returns array. Controller sends array.
// So response is `FollowUser[]`.
