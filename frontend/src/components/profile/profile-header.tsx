"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EditProfileDialog } from "./edit-profile-dialog";
import { FollowButton } from "@/features/follow/components/follow-button";
import { cn } from "@/lib/utils";

interface Profile {
    id: string;
    username: string;
    displayName: string;
    bio: string;
    location?: string;
    website?: string;
    joinDate: string;
    followers: number;
    following: number;
    posts: number;
    isVerified: boolean;
    avatarUrl: string;
    coverUrl: string;
    isFollowing: boolean;
    isSelf: boolean;
}

interface ProfileHeaderProps {
    profile: Profile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
    return (
        <div className="flex flex-col">
            {/* Cover Photo */}
            <div className="relative w-full">
                <div className="h-48 w-full bg-gradient-to-br from-primary/30 to-purple-600/30 overflow-hidden">
                    <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${profile.coverUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200'})` }}
                    />
                </div>

                {/* Avatar & Action Button Area */}
                <div className="px-6 relative -mt-16 flex justify-between items-end">
                    <div className="size-32 rounded-full border-4 border-background-light dark:border-background-dark bg-slate-200 overflow-hidden relative group">
                        <img
                            alt={profile.displayName}
                            className="w-full h-full object-cover"
                            src={profile.avatarUrl}
                        />
                    </div>
                    <div className="pb-2 flex gap-2">
                        {profile.isSelf ? (
                            <EditProfileDialog
                                trigger={
                                    <button className="px-6 py-2 rounded-full border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        Edit Profile
                                    </button>
                                }
                            />
                        ) : (
                            <FollowButton
                                userId={profile.id}
                                username={profile.username}
                                isFollowing={profile.isFollowing}
                                isSelf={profile.isSelf}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Info */}
            <div className="px-6 mt-4">
                <div className="flex items-center gap-1">
                    <h2 className="text-2xl font-bold">{profile.displayName}</h2>
                    {profile.isVerified && (
                        <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            verified
                        </span>
                    )}
                </div>
                <p className="text-slate-500">@{profile.username}</p>

                <p className="mt-4 text-[15px] leading-relaxed max-w-2xl">
                    {profile.bio}
                </p>

                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-slate-500 text-sm">
                    {profile.location && (
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-lg">location_on</span>
                            <span>{profile.location}</span>
                        </div>
                    )}
                    {profile.website && (
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-lg">link</span>
                            <a className="text-primary hover:underline" href={profile.website} target="_blank" rel="noopener noreferrer">
                                {profile.website.replace(/^https?:\/\//, "")}
                            </a>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                        <span>Joined {profile.joinDate}</span>
                    </div>
                </div>

                <div className="flex gap-6 mt-4 pb-6">
                    <Link href={`/${profile.username}/following`} className="hover:underline cursor-pointer group">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{profile.following.toLocaleString()}</span>
                        <span className="text-slate-500 ml-1">Following</span>
                    </Link>
                    <Link href={`/${profile.username}/followers`} className="hover:underline cursor-pointer group">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{profile.followers.toLocaleString()}</span>
                        <span className="text-slate-500 ml-1">Followers</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
