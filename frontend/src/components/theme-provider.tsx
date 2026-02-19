
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// We wrap the next-themes provider to make it server-component friendly
// and support the extended theme features (like forcing themes per route)
export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
