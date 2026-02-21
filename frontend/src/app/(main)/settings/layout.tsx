"use client";

import { SettingsSidebar } from "@/components/settings/settings-sidebar";

interface SettingsLayoutProps {
    children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Middle Column: Settings Nav */}
            <aside className="hidden lg:flex w-[280px] shrink-0 border-r border-slate-200 dark:border-slate-800">
                <SettingsSidebar />
            </aside>

            {/* Right Column: Settings Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-background-dark relative text-slate-900 dark:text-slate-100">
                <div className="max-w-4xl mx-auto px-6 pt-8 pb-12 lg:px-12 animate-in fade-in duration-700">
                    {children}
                </div>
            </main>
        </div>
    );
}
