"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { AppearanceProvider } from "@/components/appearance-provider";
import { trpc } from "@/lib/trpc";
import { httpBatchLink } from "@trpc/client";
import { api } from "@/lib/api-client";
import { RealtimeChatListener } from "@/features/chat/components/RealtimeChatListener";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/trpc`,
                    async headers() {
                        const token = api.getToken();
                        return token ? { Authorization: `Bearer ${token}` } : {};
                    },
                }),
            ],
        })
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <RealtimeChatListener />
                        <AppearanceProvider>
                            {children}
                        </AppearanceProvider>
                    </AuthProvider>
                    <Toaster position="top-right" />
                </ThemeProvider>
            </QueryClientProvider>
        </trpc.Provider>
    );
}
