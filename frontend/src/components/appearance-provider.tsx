"use client";

import { useEffect, useState } from "react";
import { useAppearanceStore } from "@/store/appearance.store";

const ACCENT_COLOR_MAP = {
    Blue: "217 91% 60%", // #3b82f6
    Purple: "258 90% 66%", // #8b5cf6
    Pink: "330 81% 60%", // #ec4899
    Orange: "25 95% 53%", // #f97316
    Green: "142 71% 45%", // #22c55e
};

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
    const { accentColor, fontSize, isCompact } = useAppearanceStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;

        // 1. Apply Accent Color
        const hslColor = ACCENT_COLOR_MAP[accentColor] || ACCENT_COLOR_MAP.Blue;
        root.style.setProperty("--primary", hslColor);
        root.style.setProperty("--ring", hslColor);

        // 2. Apply Font Size (Scale factor on html)
        // Default size is 50. Range is 0 to 100.
        // Base rem size is 16px. 
        // We can adjust pixel size of root document or use a css variable.
        // Let's use a CSS variable for text scaling or adjust font-size on root.
        // 0 -> 14px, 25 -> 15px, 50 -> 16px, 75 -> 17px, 100 -> 18px
        const baseSizeExtremes = [14, 15, 16, 17, 18];
        const stepIndex = fontSize / 25;
        const targetPx = baseSizeExtremes[stepIndex] ?? 16;
        root.style.fontSize = `${targetPx}px`;

        // 3. Compact Mode
        if (isCompact) {
            root.classList.add("compact-mode");
        } else {
            root.classList.remove("compact-mode");
        }

    }, [accentColor, fontSize, isCompact, mounted]);

    // Apply a subtle wrapper to prevent hydration mismatch for styling
    // But since we manipulate html root directly inside useEffect, we don't need to wrap children with a div that changes styling, 
    // unless we prefer setting variables on a wrapper div. Modifying root is better for global variables like rem and colors.

    return <>{children}</>;
}
