"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { RightSidebar } from "@/components/layout/right-sidebar"
import { AuthGuard } from "@/features/auth/components/AuthGuard"
import { useAuth } from "@/features/auth/components/AuthProvider"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const { user } = useAuth()
    const isMessages = pathname.startsWith("/messages")
    const isSettings = pathname.startsWith("/settings")

    return (
        <AuthGuard>
            <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased min-h-screen font-display">
                <div className="max-w-[1440px] mx-auto flex justify-center min-h-screen relative">
                    {/* Left Sidebar */}
                    <Sidebar className="sticky top-0 h-screen shrink-0 hidden md:flex" />

                    {/* Center Feed / Content */}
                    <main className={cn(
                        "flex-1 border-x border-slate-200 dark:border-slate-800/50 min-h-screen transition-all",
                        (isMessages || isSettings) ? "max-w-[1168px]" : "max-w-[800px]"
                    )}>
                        {children}
                    </main>

                    {/* Right Sidebar - Hidden on Messages/Settings */}
                    {!isMessages && !isSettings && (
                        <RightSidebar className="sticky top-0 h-screen shrink-0 hidden lg:flex" />
                    )}
                </div>

                {/* Mobile Navigation Bar */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-slate-800/50 flex items-center justify-around z-50">
                    <MobileNavLink icon="home" href="/" active={pathname === "/"} />
                    <MobileNavLink icon="search" href="/explore" active={pathname === "/explore"} />
                    <MobileNavLink icon="notifications" href="/notifications" active={pathname === "/notifications"} />
                    <MobileNavLink icon="mail" href="/messages" badge active={isMessages} />
                    <MobileNavLink icon="person" href={`/${user?.username || "profile"}`} active={pathname.startsWith(`/${user?.username}`)} />
                </div>
            </div>
        </AuthGuard>
    )
}

function MobileNavLink({ icon, href, active, badge }: { icon: string, href: string, active?: boolean, badge?: boolean }) {
    return (
        <Link href={href} className={cn("p-2 transition-colors", active ? "text-primary" : "text-slate-500")}>
            <span
                className="material-symbols-outlined relative"
                style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}
            >
                {icon}
                {badge && <div className="absolute top-0 right-0 size-2 bg-primary rounded-full border border-background"></div>}
            </span>
        </Link>
    )
}
