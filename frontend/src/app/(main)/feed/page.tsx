
"use client";

import React from 'react';
import { Feed } from '@/features/feed/Feed';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Compass } from 'lucide-react';

export default function FeedPage() {
    return (
        <div className="flex-1 flex flex-col h-full max-w-2xl mx-auto border-x bg-background">
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b">
                <div className="px-4 py-3">
                    <h1 className="text-xl font-bold tracking-tight">Home</h1>
                </div>

                <Tabs defaultValue="for-you" className="w-full">
                    <TabsList className="w-full h-12 bg-transparent p-0 rounded-none border-b-0">
                        <TabsTrigger
                            value="for-you"
                            className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                <span>For you</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="following"
                            className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            <div className="flex items-center gap-2">
                                <Compass className="h-4 w-4" />
                                <span>Following</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </header>

            <main className="flex-1 overflow-hidden">
                <Feed />
            </main>
        </div>
    );
}
