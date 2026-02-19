
import type { Metadata } from 'next';
import React from 'react';

// Explicitly define no text/code/assets indexing for Auth routes (security best practice)
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
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 md:p-8">
            {/* 
        This is the shared layout for all auth screens.
        It centers content and provides a consistent background.
      */}
            <div className="w-full max-w-sm space-y-6 sm:max-w-md">
                {/* Placeholder specific header logic would go here if needed, 
            but for now, we let children render their own headers. */}
                {children}
            </div>
        </div>
    );
}
