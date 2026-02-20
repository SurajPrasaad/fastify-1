"use client"

import * as React from "react"
import {
    Bell,
    Home,
    Mail,
    MoreHorizontal,
    Search,
    Settings,
    User,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { NavItem } from "@/components/layout/nav-item"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/features/auth/components/AuthProvider"
import { useUnreadCount } from "@/features/notifications/hooks"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultCollapsed?: boolean
}

export function Sidebar({ className, defaultCollapsed = false }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
    const { user } = useAuth()
    const { data: unreadCount = 0 } = useUnreadCount()

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed)
    }

    const initials = user?.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
        : "??"

    return (
        <div
            className={cn(
                "relative flex flex-col border-r bg-background pb-4 transition-all duration-300",
                isCollapsed ? "w-[80px]" : "w-[280px]",
                className
            )}
        >
            <div className="flex h-14 items-center justify-between px-4 py-4">
                {!isCollapsed && (
                    <span className="text-xl font-bold tracking-tight text-primary">
                        SocialApp
                    </span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCollapse}
                    className={cn("h-8 w-8", isCollapsed && "mx-auto")}
                >
                    {isCollapsed ? (
                        <PanelLeftOpen className="h-4 w-4" />
                    ) : (
                        <PanelLeftClose className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
            </div>

            <Separator />

            <ScrollArea className="flex-1 px-2 py-4">
                <nav className="grid gap-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                    {/* Main Navigation */}
                    <NavItem
                        title="Home"
                        href="/"
                        icon={Home}
                        isCollapsed={isCollapsed}
                    />
                    <NavItem
                        title="Explore"
                        href="/explore"
                        icon={Search}
                        isCollapsed={isCollapsed}
                    />
                    <NavItem
                        title="Notifications"
                        href="/notifications"
                        icon={Bell}
                        isCollapsed={isCollapsed}
                        label={unreadCount > 0 ? (unreadCount > 99 ? "99+" : String(unreadCount)) : undefined}
                    />
                    <NavItem
                        title="Messages"
                        href="/messages"
                        icon={Mail}
                        isCollapsed={isCollapsed}
                        label="12"
                    />
                    <NavItem
                        title="Profile"
                        href={user ? `/${user.username}` : "/login"}
                        icon={User}
                        isCollapsed={isCollapsed}
                    />
                    <NavItem
                        title="Settings"
                        href="/settings"
                        icon={Settings}
                        isCollapsed={isCollapsed}
                    />
                </nav>
            </ScrollArea>

            <div className="mt-auto p-4">
                {/* User Card Area */}
                {user ? (
                    <div className={cn("flex items-center gap-2", isCollapsed && "justify-center")}>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl || undefined} alt={`@${user.username}`} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium truncate">{user.name}</span>
                                <span className="text-xs text-muted-foreground truncate">@{user.username}</span>
                            </div>
                        )}
                        {!isCollapsed && (
                            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className={cn("flex items-center gap-2", isCollapsed && "justify-center")}>
                        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                        {!isCollapsed && (
                            <div className="flex flex-col gap-1">
                                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                                <div className="h-2 w-12 bg-muted animate-pulse rounded" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
