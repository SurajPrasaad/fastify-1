export type AppRole = "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";

export enum RoleValue {
    USER = 0,
    MODERATOR = 1,
    ADMIN = 2,
    SUPER_ADMIN = 3,
}

// Accepts both string role names (\"MODERATOR\") and numeric values (1 or \"1\")
export function getRoleValue(role?: string | number | null): RoleValue {
    if (role === null || role === undefined) {
        return RoleValue.USER;
    }

    // Handle numeric or numeric-string roles: 0,1,2,3
    const numeric =
        typeof role === "number"
            ? role
            : typeof role === "string" && /^[0-3]$/.test(role)
            ? parseInt(role, 10)
            : undefined;

    if (numeric === 0) return RoleValue.USER;
    if (numeric === 1) return RoleValue.MODERATOR;
    if (numeric === 2) return RoleValue.ADMIN;
    if (numeric === 3) return RoleValue.SUPER_ADMIN;

    // Fallback to string constants from backend like \"MODERATOR\"
    switch (role) {
        case "MODERATOR":
            return RoleValue.MODERATOR;
        case "ADMIN":
            return RoleValue.ADMIN;
        case "SUPER_ADMIN":
            return RoleValue.SUPER_ADMIN;
        default:
            return RoleValue.USER;
    }
}

export function getDashboardPathForRole(role?: string | number | null): string {
    const value = getRoleValue(role);

    switch (value) {
        case RoleValue.MODERATOR:
            return "/moderator";
        case RoleValue.ADMIN:
            return "/admin";
        case RoleValue.SUPER_ADMIN:
            return "/super-admin";
        case RoleValue.USER:
        default:
            return "/";
    }
}

