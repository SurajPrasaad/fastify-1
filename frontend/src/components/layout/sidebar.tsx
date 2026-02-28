"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/features/auth/components/AuthProvider"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const { user, logout } = useAuth()
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()
    const router = useRouter()

    return (
        <aside className={cn("hidden md:flex flex-col w-72 h-screen p-6", className)}>
            <div className="flex flex-col h-full justify-between">
                <div className="flex flex-col gap-8">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 px-3 group">
                        <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-110">
                            <span className="material-symbols-outlined text-2xl">rocket_launch</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">DevAtlas</h1>
                    </Link>

                    {/* Nav Links */}
                    <nav className="flex flex-col gap-2">
                        <SidebarLink icon="home" label="Home" href="/" active={pathname === "/"} fillIcon />
                        <SidebarLink icon="explore" label="Explore" href="/explore" active={pathname === "/explore"} />
                        <SidebarLink icon="mail" label="Messages" href="/messages" active={pathname.startsWith("/messages")} badge="4" />
                        <SidebarLink icon="call" label="Calls" href="/calls" active={pathname === "/calls"} />
                        <SidebarLink icon="notifications" label="Notifications" href="/notifications" active={pathname === "/notifications"} />
                        <SidebarLink icon="person" label="Profile" href={`/${user?.username || "profile"}`} active={user?.username ? pathname.startsWith(`/${user.username}`) : false} />
                        <SidebarLink icon="bookmark" label="Bookmarks" href="/bookmarks" active={pathname === "/bookmarks"} />
                        <SidebarLink icon="settings" label="Settings" href="/settings" active={pathname === "/settings"} />
                    </nav>

                    {/* <button className="w-full bg-primary text-white font-bold py-4 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">edit</span>
                        Post
                    </button> */}
                </div>

                {/* Bottom Sidebar Utils */}
                <div className="flex flex-col gap-4">
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-surface-dark rounded-xl">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-slate-500">
                                {theme === "dark" ? "dark_mode" : "light_mode"}
                            </span>
                            <span className="text-sm font-medium">Dark Mode</span>
                        </div>
                        <Switch
                            checked={theme === "dark"}
                            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                            className="data-[state=checked]:bg-primary"
                        />
                    </div>

                    {/* User Account */}
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer group outline-none">
                                    <div className="size-10 rounded-full bg-slate-500 overflow-hidden shrink-0">
                                        <img
                                            className="w-full h-full object-cover"
                                            alt={user.name}
                                            src={user.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCiOL2n_wnGX-tkNBmn9gmSIO2py_5xhODyOdE2R10P7HxgjYmnH9d38rfNSl-_PT0a7K-oozQygeBMztHAO5W5u5qEeMlbqCr6_Hqn9JcyIEX8X7LPzhvFFNlxpMD2aRyuRUaW5o5lxnHkj-2oGoMSGk37wybjSgFXw0anwxAHcpicg8P9U-6cfeulPNyxhBCyzbfca7rtxBGgJ0jZPwfhUoevY9RSvmr64jIn2fXTcvF0SAn7PXAo7VgIt58c"}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{user.name}</p>
                                        <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">more_horiz</span>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-2xl shadow-black/20 mb-4 ml-6">
                                <DropdownMenuItem
                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:bg-slate-100 dark:focus:bg-slate-800 outline-none"
                                    onClick={() => router.push(`/${user.username}`)}
                                >
                                    <span className="material-symbols-outlined text-slate-500">person</span>
                                    <span className="font-semibold">Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 transition-colors focus:bg-rose-50 dark:focus:bg-rose-950/20 outline-none"
                                    onClick={() => logout()}
                                >
                                    <span className="material-symbols-outlined">logout</span>
                                    <span className="font-semibold">Logout @{user.username}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="px-3 py-2 animate-pulse flex items-center gap-3">
                            <div className="size-10 rounded-full bg-slate-300 dark:bg-slate-800 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-20 bg-slate-300 dark:bg-slate-800 rounded" />
                                <div className="h-2 w-16 bg-slate-300 dark:bg-slate-800 rounded" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    )
}

function SidebarLink({ icon, label, href, active, badge, fillIcon }: {
    icon: string,
    label: string,
    href: string,
    active?: boolean,
    badge?: string,
    fillIcon?: boolean
}) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all relative group",
                active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
            )}
        >
            <span
                className="material-symbols-outlined transition-all text-[24px]"
                style={{ fontVariationSettings: `'FILL' ${active || fillIcon ? 1 : 0}` }}
            >
                {icon}
            </span>
            <span className="text-lg">{label}</span>
            {badge && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 size-5 bg-primary text-[10px] text-white rounded-full flex items-center justify-center font-bold border-2 border-background">
                    {badge}
                </span>
            )}
        </Link>
    )
}
