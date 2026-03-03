"use client";

import { useCurrentUser } from "@/features/auth/hooks";
import type { AppRole } from "@/features/auth/role-utils";

export function useModeratorRole() {
  const { data: user, isLoading } = useCurrentUser();
  const role = (user?.auth?.role ?? "USER") as AppRole;
  const isModerator = role === "MODERATOR" || role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN";

  return {
    role,
    isModerator,
    isAdmin,
    isSuperAdmin,
    isLoading,
    userId: user?.id,
  };
}
