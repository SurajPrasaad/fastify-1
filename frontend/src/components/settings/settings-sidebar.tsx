"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { User, Shield, Bell, Lock, CreditCard, Smartphone } from "lucide-react";

const sidebarNavItems = [
    {
        title: "Profile",
        href: "/settings/profile",
        icon: User,
    },
    {
        title: "Account",
        href: "/settings/account",
        icon: Lock,
    },
    {
        title: "Security",
        href: "/settings/security",
        icon: Shield,
    },
    {
        title: "Privacy",
        href: "/settings/privacy",
        icon: Smartphone, // Using Smartphone effectively as 'device/privacy' placeholder or Lock
    },
    {
        title: "Notifications",
        href: "/settings/notifications",
        icon: Bell,
    },
];

export function SettingsSidebar() {
    const pathname = usePathname();

    return (
        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {sidebarNavItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                >
                    <span
                        className={cn(
                            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                            pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                        )}
                    >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.title}
                    </span>
                </Link>
            ))}
        </nav>
    );
}
