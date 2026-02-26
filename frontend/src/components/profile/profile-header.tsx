"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EditProfileDialog } from "./edit-profile-dialog";
import { FollowButton } from "@/features/follow/components/follow-button";
import { cn } from "@/lib/utils";
import { useCall } from "@/features/call/context/CallContext";
import { Phone, Video, Settings } from "lucide-react";

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
    techStack?: string[];
}

interface ProfileHeaderProps {
    profile: Profile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
    const { initiateCall } = useCall();

    const handleCall = (type: 'AUDIO' | 'VIDEO') => {
        initiateCall(profile.id, profile.displayName, profile.avatarUrl, type);
    };

    return (
        <div className="flex flex-col">
            {/* Cover photo area */}
            <div className="relative w-full">
                <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 relative group overflow-hidden">
                    {profile.coverUrl ? (
                        <img
                            src={profile.coverUrl}
                            alt={`${profile.displayName}'s banner`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10" />
                    )}
                </div>
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
                            <>
                                <EditProfileDialog
                                    trigger={
                                        <button className="px-6 py-2 rounded-full border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            Edit Profile
                                        </button>
                                    }
                                />
                                <Link
                                    href="/settings/profile"
                                    className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                                >
                                    <Settings className="w-5 h-5 text-slate-500" />
                                </Link>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleCall('AUDIO')}
                                    className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center text-slate-500"
                                >
                                    <Phone className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleCall('VIDEO')}
                                    className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center text-slate-500"
                                >
                                    <Video className="w-5 h-5" />
                                </button>
                                <FollowButton
                                    userId={profile.id}
                                    username={profile.username}
                                    isFollowing={profile.isFollowing}
                                    isSelf={profile.isSelf}
                                />
                            </>
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

                {/* Tech Stack / Tags */}
                {profile.techStack && profile.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {profile.techStack.map((tech) => (
                            <span
                                key={tech}
                                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-colors"
                            >
                                #{tech}
                            </span>
                        ))}
                    </div>
                )}

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
                    <div className="cursor-default group flex items-center">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{profile.posts.toLocaleString()}</span>
                        <span className="text-slate-500 ml-1">Posts</span>
                    </div>
                    <Link href={`/${profile.username}/following`} className="hover:underline cursor-pointer group flex items-center">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{profile.following.toLocaleString()}</span>
                        <span className="text-slate-500 ml-1">Following</span>
                    </Link>
                    <Link href={`/${profile.username}/followers`} className="hover:underline cursor-pointer group flex items-center">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{profile.followers.toLocaleString()}</span>
                        <span className="text-slate-500 ml-1">Followers</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
