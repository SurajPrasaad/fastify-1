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
        bio: profile.bio || "No bio yet",
        location: "Planet Earth", // Placeholder since it's not in DB yet
        website: "", // Placeholder
        joinDate: new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        followers: profile.profile.followersCount,
        following: profile.profile.followingCount,
        posts: profile.profile.postsCount,
        isVerified: profile.auth.isEmailVerified,
        avatarUrl: profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`,
        coverUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200",
        isFollowing: profile.isFollowing,
        isSelf: currentUser?.id === profile.id,
    };

    return (
        <div className="container py-6 mx-auto">
            <ProfileHeader profile={adaptedProfile} />
            <Separator className="my-6" />
            <ProfileTabs username={username} />
            <main className="mt-6">
                {children}
            </main>
        </div>
    );
}
