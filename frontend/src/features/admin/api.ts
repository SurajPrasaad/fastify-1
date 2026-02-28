import { api } from "@/lib/api-client";

export const AdminApi = {
    getStats: async (): Promise<{ totalUsers: number; activeUsers: number }> => {
        return api.get("/users/admin/stats");
    },
    promoteToAdmin: async (userId: string): Promise<{ message: string }> => {
        return api.post(`/users/promote/${userId}`);
    },
};
