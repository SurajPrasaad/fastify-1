"use client"

import Link from "next/link"
import { Search, Bell, Mail } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/theme-toggle"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/features/auth/components/AuthProvider"

import { Logo } from "./logo"
import { useChatStore } from "@/features/chat/store/chat-store"
import React from "react"

export function Header() {
    const unreadCounts = useChatStore((state) => state.unreadCounts)
    const totalUnreadCount = React.useMemo(() => {
        return Object.values(unreadCounts).reduce((acc, current) => acc + (current || 0), 0)
    }, [unreadCounts])

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-6">
                <div className="flex flex-1 items-center gap-4 md:gap-8">
                    {/* Mobile Menu Trigger would come here */}
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/notifications">
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
                            <span className="sr-only">Notifications</span>
                        </Button>
                    </Link>
                    <Link href="/messages">
                        <Button variant="ghost" size="icon" className="relative">
                            <Mail className="h-5 w-5" />
                            {totalUnreadCount > 0 && (
                                <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary text-[10px] flex items-center justify-center text-white font-bold">
                                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                                </span>
                            )}
                            <span className="sr-only">Messages</span>
                        </Button>
                    </Link>
                    <ModeToggle />
                    <UserNav />
                </div>
            </div>
        </header>
    )
}

function UserNav() {
    const { user, logout } = useAuth()

    if (!user) return null

    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl || undefined} alt={`@${user.username}`} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={`/${user.username}`}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 cursor-pointer"
                    onClick={() => logout()}
                >
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
