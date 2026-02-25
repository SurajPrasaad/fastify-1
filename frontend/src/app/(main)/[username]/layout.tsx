"use client";

import { usePathname, useRouter, useParams, notFound } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/use-user';
import { useAuth } from '@/hooks/use-auth';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileTabs } from '@/components/profile/profile-tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const username = params.username as string;

    const { data: profile, isLoading, error } = useProfile(username);
    const { user: currentUser } = useAuth();

    const isFollowPage = pathname?.includes("/followers") || pathname?.includes("/following");

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !profile) {
        return notFound();
    }

    if (isFollowPage) {
        // Return simplified layout for follow pages
        return (
            <div className="container py-2 mx-auto">
                <div className="flex items-center gap-4 mb-2 px-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-lg">{profile.name}</h1>
                        <span className="text-xs text-muted-foreground">@{profile.username}</span>
                    </div>
                </div>
                {children}
            </div>
        );
    }

    // Adapt the backend response to the ProfileHeader's expected format
    const adaptedProfile = {
        id: profile.id,
        username: profile.username,
        displayName: profile.name,
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || "",
        joinDate: new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        followers: profile.profile.followersCount,
        following: profile.profile.followingCount,
        posts: profile.profile.postsCount,
        isVerified: profile.auth.status === "ACTIVE", // Just for UI consistency in demo, ideally a real flag
        avatarUrl: profile.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${profile.username}`,
        coverUrl: profile.coverUrl || "",
        isFollowing: profile.isFollowing,
        isSelf: currentUser?.id === profile.id,
        techStack: profile.profile.techStack || [],
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
            {/* Header Nav */}
            <header className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-3 flex items-center gap-8 border-b border-slate-200 dark:border-slate-800 transition-all">
                <button
                    onClick={() => router.back()}
                    className="size-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                </button>
                <div>
                    <h2 className="text-lg font-bold leading-none mb-1">{profile.name}</h2>
                    <p className="text-xs text-slate-500 font-medium">{profile.profile.postsCount} Posts</p>
                </div>
            </header>

            {/* Profile Content */}
            <ProfileHeader profile={adaptedProfile} />

            {/* Tabs */}
            <div className="sticky top-[64px] z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                <ProfileTabs username={username} />
            </div>

            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
