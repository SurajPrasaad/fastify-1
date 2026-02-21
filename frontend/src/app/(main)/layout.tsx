"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { RightSidebar } from "@/components/layout/right-sidebar"
import { AuthGuard } from "@/features/auth/components/AuthGuard"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isMessages = pathname.startsWith("/messages")
    const isSettings = pathname.startsWith("/settings")

    return (
        <AuthGuard>
            <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased min-h-screen font-display">
                <div className="max-w-[1440px] mx-auto flex justify-center min-h-screen relative">
                    {/* Left Sidebar: Fixed */}
                    <div className="hidden md:block w-72 shrink-0">
                        <Sidebar className="fixed left-[calc(50%-720px)] top-0 h-screen" />
                    </div>

                    {/* Center Feed / Content */}
                    <main className={cn(
                        "w-full border-x border-slate-200 dark:border-slate-800/50 min-h-screen transition-all",
                        (isMessages || isSettings) ? "max-w-[1168px]" : "max-w-[640px]"
                    )}>
                        {children}
                    </main>

                    {/* Right Sidebar: Fixed - Hidden on Messages/Settings */}
                    {!isMessages && !isSettings && (
                        <div className="hidden lg:block w-80 shrink-0">
                            <RightSidebar className="fixed right-[calc(50%-720px)] top-0 h-screen" />
                        </div>
                    )}
                </div>

                {/* Mobile Navigation Bar */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-slate-800/50 flex items-center justify-around z-50">
                    <MobileNavLink icon="home" href="/" active={pathname === "/"} />
                    <MobileNavLink icon="search" href="/search" active={pathname === "/search"} />
                    <MobileNavLink icon="explore" href="/explore" active={pathname === "/explore"} />
                    <MobileNavLink icon="mail" href="/messages" badge active={isMessages} />
                    <MobileNavLink icon="person" href="/profile" active={pathname === "/profile"} />
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

import { cn } from "@/lib/utils"
