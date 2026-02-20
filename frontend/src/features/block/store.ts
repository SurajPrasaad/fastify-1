import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BlockedUser } from "./types";
import { BlockApi } from "./api";

interface BlockState {
    blockedUsers: Set<string>;
    blockedUsersList: BlockedUser[];
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchBlockedUsers: () => Promise<void>;
    blockUser: (userId: string) => Promise<void>;
    unblockUser: (userId: string) => Promise<void>;
    isBlocked: (userId: string) => boolean;
}

export const useBlockStore = create<BlockState>()(
    persist(
        (set, get) => ({
            blockedUsers: new Set<string>(),
            blockedUsersList: [],
            isInitialized: false,
            isLoading: false,
            error: null,

            fetchBlockedUsers: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await BlockApi.getBlockedUsers();
                    // Handle both direct array and { data: [] } response formats if applicable
                    const users = Array.isArray(response) ? response : (response as any).data || [];

                    set({
                        blockedUsers: new Set(users.map((u: any) => u.id)),
                        blockedUsersList: users,
                        isInitialized: true,
                        isLoading: false
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            blockUser: async (userId: string) => {
                const previousBlocked = new Set(get().blockedUsers);
                set((state) => ({
                    blockedUsers: new Set(state.blockedUsers).add(userId)
                }));

                try {
                    await BlockApi.blockUser(userId);
                    // Refresh the list to get full user details
                    get().fetchBlockedUsers();
                } catch (error: any) {
                    set({ blockedUsers: previousBlocked, error: error.message });
                    throw error;
                }
            },

            unblockUser: async (userId: string) => {
                const previousBlocked = new Set(get().blockedUsers);
                const previousList = [...get().blockedUsersList];

                set((state) => {
                    const next = new Set(state.blockedUsers);
                    next.delete(userId);
                    return {
                        blockedUsers: next,
                        blockedUsersList: state.blockedUsersList.filter(u => u.id !== userId)
                    };
                });

                try {
                    await BlockApi.unblockUser(userId);
                } catch (error: any) {
                    set({
                        blockedUsers: previousBlocked,
                        blockedUsersList: previousList,
                        error: error.message
                    });
                    throw error;
                }
            },

            isBlocked: (userId: string) => {
                return get().blockedUsers.has(userId);
            },
        }),
        {
            name: "block-storage",
            // Set is not serializable by default in JSON
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name);
                    if (!str) return null;
                    const data = JSON.parse(str);
                    return {
                        ...data,
                        state: {
                            ...data.state,
                            blockedUsers: new Set(data.state.blockedUsers),
                        },
                    };
                },
                setItem: (name, newValue) => {
                    const str = JSON.stringify({
                        ...newValue,
                        state: {
                            ...newValue.state,
                            blockedUsers: Array.from(newValue.state.blockedUsers),
                        },
                    });
                    localStorage.setItem(name, str);
                },
                removeItem: (name) => localStorage.removeItem(name),
            },
        }
    )
);
