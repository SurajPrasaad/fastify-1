
import type { Metadata } from 'next';
import React from 'react';
import { GuestGuard } from '@/features/auth/components/AuthGuard';

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
    title: {
        template: '%s | Secure Auth',
        default: 'Authentication',
    },
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <GuestGuard>
            <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 md:p-8">
                <div className="w-full max-w-sm space-y-6 sm:max-w-md">
                    {children}
                </div>
            </div>
        </GuestGuard>
    );
}
