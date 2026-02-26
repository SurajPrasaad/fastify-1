"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useAppearanceStore } from "@/store/appearance.store";

const ACCENT_COLORS = [
    { name: "Blue", color: "bg-[#3b82f6]" },
    { name: "Purple", color: "bg-[#8b5cf6]" },
    { name: "Pink", color: "bg-[#ec4899]" },
    { name: "Orange", color: "bg-[#f97316]" },
    { name: "Green", color: "bg-[#22c55e]" },
] as const;

export default function SettingsAppearancePage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const {
        accentColor,
        setAccentColor,
        fontSize,
        setFontSize,
        isCompact,
        setIsCompact,
        resetAppearance
    } = useAppearanceStore();

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-10">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Appearance Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Customize how SocialApp looks on your device.</p>
            </header>

            <div className="space-y-12">
                {/* Theme Section */}
                <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] fill-icon text-primary">palette</span>
                        Theme
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Light Mode */}
                        <ThemeCard
                            label="Light"
                            active={theme === 'light'}
                            onClick={() => setTheme('light')}
                            previewClass="bg-white border-slate-200"
                        >
                            <div className="space-y-2">
                                <div className="w-2/3 h-2 bg-slate-100 rounded-full" />
                                <div className="w-full h-8 bg-slate-50 rounded-lg border border-slate-100" />
                                <div className="w-1/2 h-2 bg-slate-100 rounded-full" />
                            </div>
                            <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-slate-100" />
                        </ThemeCard>

                        {/* Dark Mode */}
                        <ThemeCard
                            label="Dark"
                            active={theme === 'dark'}
                            onClick={() => setTheme('dark')}
                            previewClass="bg-slate-950 border-slate-800"
                        >
                            <div className="space-y-2">
                                <div className="w-2/3 h-2 bg-slate-900 rounded-full" />
                                <div className="w-full h-8 bg-slate-900 rounded-lg border border-slate-800" />
                                <div className="w-1/2 h-2 bg-slate-900 rounded-full" />
                            </div>
                            <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-slate-900" />
                        </ThemeCard>

                        {/* System Default */}
                        <ThemeCard
                            label="System Default"
                            active={theme === 'system'}
                            onClick={() => setTheme('system')}
                            previewClass="border-slate-200 dark:border-slate-800"
                        >
                            <div className="absolute inset-0 flex">
                                <div className="flex-1 bg-white p-3">
                                    <div className="w-full h-2 bg-slate-100 rounded-full" />
                                </div>
                                <div className="flex-1 bg-slate-950 p-3">
                                    <div className="w-full h-2 bg-slate-900 rounded-full" />
                                </div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="px-2 py-1 bg-white dark:bg-slate-900 border border-primary/20 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm">Auto</div>
                            </div>
                        </ThemeCard>
                    </div>
                </section>

                {/* Accent Color Section */}
                <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] fill-icon text-primary">colorize</span>
                        Accent Color
                    </h3>
                    <div className="flex flex-wrap gap-5">
                        {ACCENT_COLORS.map((color) => {
                            const isSelected = accentColor === color.name;
                            return (
                                <button
                                    key={color.name}
                                    onClick={() => setAccentColor(color.name)}
                                    className={cn(
                                        "size-12 rounded-full transition-all flex items-center justify-center relative",
                                        color.color,
                                        isSelected ? "ring-4 ring-offset-4 ring-primary dark:ring-offset-background-dark scale-110" : "hover:scale-105"
                                    )}
                                >
                                    {isSelected && <div className="size-4 rounded-full bg-white shadow-sm animate-in zoom-in duration-300" />}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Font Size Section */}
                <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] fill-icon text-primary">format_size</span>
                        Font Size
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-lg p-8 border border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col gap-6">
                            <div className="flex justify-between items-end px-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Extra Small</span>
                                <span className="text-sm font-black text-primary uppercase tracking-widest">Medium</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Extra Large</span>
                            </div>

                            <div className="relative h-10 flex items-center group">
                                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                <div className="absolute h-2 bg-primary rounded-full transition-all duration-300" style={{ width: `${fontSize}%` }} />

                                <div className="absolute inset-0 flex justify-between items-center px-0.5">
                                    {[0, 25, 50, 75, 100].map((step) => (
                                        <button
                                            key={step}
                                            onClick={() => setFontSize(step)}
                                            className={cn(
                                                "size-4 rounded-full border-2 transition-all relative z-10",
                                                fontSize === step
                                                    ? "bg-primary border-white dark:border-slate-900 scale-125 shadow-lg shadow-primary/40 ring-4 ring-primary/20"
                                                    : step < fontSize
                                                        ? "bg-primary border-primary"
                                                        : "bg-slate-300 dark:bg-slate-700 border-transparent hover:bg-slate-400"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 mt-2 shadow-sm">
                                <p className={cn(
                                    "transition-all duration-300 leading-relaxed text-slate-600 dark:text-slate-300",
                                    fontSize === 0 && "text-xs",
                                    fontSize === 25 && "text-sm",
                                    fontSize === 50 && "text-base",
                                    fontSize === 75 && "text-lg",
                                    fontSize === 100 && "text-xl",
                                )}>
                                    This is a preview of how text will look in your feed. We aim to keep things readable and clean for your best browsing experience.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Interface Density Section */}
                <section>
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900/40 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-primary fill-icon">view_comfy</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-[15px]">Compact Mode</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Reduces padding and spacing to show more content.</p>
                            </div>
                        </div>
                        <Switch
                            checked={isCompact}
                            onCheckedChange={setIsCompact}
                            className="data-[state=checked]:bg-primary"
                        />
                    </div>
                </section>

                {/* Footer Action */}
                <footer className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 overflow-hidden">
                    <button
                        onClick={() => {
                            resetAppearance();
                            setTheme('system');
                        }}
                        className="px-6 py-2.5 rounded-lg font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all font-display">
                        Reset Defaults
                    </button>
                    <button className="px-10 py-3 bg-primary text-white rounded-lg font-black text-sm hover:brightness-110 shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 active:translate-y-0 font-display">
                        Save Changes
                    </button>
                </footer>
            </div>
        </div>
    );
}

function ThemeCard({ label, active, onClick, previewClass, children }: any) {
    return (
        <button className="group flex flex-col text-left outline-none" onClick={onClick}>
            <div className={cn(
                "w-full aspect-[4/3] rounded-lg border-2 p-3 mb-3 relative overflow-hidden transition-all duration-300",
                previewClass,
                active ? "border-primary shadow-xl shadow-primary/10 scale-[1.02]" : "hover:border-primary/30"
            )}>
                {children}
                {active && (
                    <div className="absolute inset-0 bg-primary/5 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                        <div className="size-9 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/40">
                            <span className="material-symbols-outlined text-[20px] font-bold">check</span>
                        </div>
                    </div>
                )}
            </div>
            <span className={cn(
                "text-sm font-black ml-1 transition-colors",
                active ? "text-primary" : "text-slate-500 dark:text-slate-400"
            )}>{label}</span>
        </button>
    );
}
