
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { LucideIcon } from "lucide-react"

interface NavItemProps {
    title: string
    href: string
    icon: LucideIcon
    isCollapsed: boolean
    label?: string
}

export function NavItem({ title, href, icon: Icon, isCollapsed, label }: NavItemProps) {
    const pathname = usePathname()
    const isActive = pathname === href

    if (isCollapsed) {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Link
                            href={href}
                            className={cn(
                                buttonVariants({ variant: isActive ? "default" : "ghost", size: "icon" }),
                                "h-9 w-9",
                                isActive && "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            <span className="sr-only">{title}</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-4">
                        {title}
                        {label && (
                            <span className="ml-auto text-muted-foreground">
                                {label}
                            </span>
                        )}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <Link
            href={href}
            className={cn(
                buttonVariants({ variant: isActive ? "default" : "ghost", size: "sm" }),
                isActive && "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white",
                "justify-start"
            )}
        >
            <Icon className="mr-2 h-4 w-4" />
            {title}
            {label && (
                <span className={cn("ml-auto", isActive && "text-background dark:text-white")}>
                    {label}
                </span>
            )}
        </Link>
    )
}
