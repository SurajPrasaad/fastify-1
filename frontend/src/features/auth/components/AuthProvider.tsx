"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useCurrentUser, useAuthActions } from "../hooks";
import { User } from "../types";
import { useAuthStore } from "../stores/auth.store";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: user, isLoading, isFetching } = useCurrentUser();
    const { logout } = useAuthActions();
    const setUser = useAuthStore((state) => state.setUser);

    useEffect(() => {
        if (user) {
            setUser(user);
        } else if (!isLoading && !isFetching) {
            setUser(null);
        }
    }, [user, setUser, isLoading, isFetching]);

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{
            user: user ?? null,
            isLoading: isLoading || isFetching,
            isAuthenticated,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
