import { api } from "@/lib/api-client";

export interface AdminUserListItem {
    id: string;
    username: string;
    email: string;
    name: string;
    bio?: string;
    avatarUrl?: string;
    coverUrl?: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN" | "MODERATOR" | "RISK_ANALYST" | "VIEWER";
    status: "ACTIVE" | "DEACTIVATED" | "SUSPENDED" | "DELETED";
    followersCount?: number;
    followingCount?: number;
    postsCount?: number;
    createdAt: string;
    updatedAt: string;
    regionAffinity?: string | null;
    techStack?: string[];
    website?: string;
    location?: string;
    subscriptionPlan?: string;
}

export const AdminApi = {
    getStats: async (): Promise<{ totalUsers: number; activeUsers: number }> => {
        return api.get("/users/admin/stats");
    },

    promoteToAdmin: async (userId: string): Promise<{ message: string }> => {
        return api.post(`/users/promote/${userId}`);
    },

    // Fetch up to 500 users for admin management (client-side pagination)
    listUsers: async (): Promise<AdminUserListItem[]> => {
        return api.get("/users?limit=500&offset=0");
    },
};
