"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Link as LinkIcon, Calendar, CheckCircle2, MoreHorizontal, Mail } from "lucide-react";
import { EditProfileDialog } from "./edit-profile-dialog";
import { FollowButton } from "@/features/follow/components/follow-button";

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
            {/* Cover Image Area */}
            <div className="relative h-48 md:h-64 w-full bg-muted rounded-lg overflow-hidden">
                {profile.coverUrl && (
                    <img
                        src={profile.coverUrl}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Info Bar */}
            <div className="px-4 pb-2">
                <div className="relative flex justify-between items-end -mt-12 md:-mt-16 mb-4">
                    {/* Avatar */}
                    <div className="relative">
                        <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background ring-2 ring-background/50">
                            <AvatarImage src={profile.avatarUrl} alt={profile.username} />
                            <AvatarFallback>{profile.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-green-500 ring-2 ring-background" title="Online" />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mb-2">
                        {profile.isSelf ? (
                            <EditProfileDialog
                                trigger={<Button variant="outline">Edit Profile</Button>}
                            />
                        ) : (
                            <>
                                <FollowButton
                                    userId={profile.id}
                                    username={profile.username}
                                    isFollowing={profile.isFollowing}
                                    isSelf={profile.isSelf}
                                />
                                <Button variant="ghost" size="icon">
                                    <Mail className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold leading-none">{profile.displayName}</h1>
                        {profile.isVerified && <CheckCircle2 className="w-5 h-5 text-blue-500" fill="currentColor" color="white" />}
                    </div>
                    <p className="text-muted-foreground font-medium">@{profile.username}</p>
                </div>

                <div className="mt-4 max-w-2xl">
                    <p className="whitespace-pre-wrap">{profile.bio}</p>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-muted-foreground">
                    {profile.location && (
                        <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{profile.location}</span>
                        </div>
                    )}
                    {profile.website && (
                        <div className="flex items-center gap-1">
                            <LinkIcon className="w-4 h-4" />
                            <a href={profile.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                {profile.website.replace(/^https?:\/\//, '')}
                            </a>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {profile.joinDate}</span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex gap-6 mt-4 pt-4 border-t border-border/50">
                    <Link href={`/${profile.username}/following`} className="flex items-center gap-1 hover:underline cursor-pointer transition-colors">
                        <span className="font-bold text-foreground">{profile.following.toLocaleString()}</span>
                        <span className="text-muted-foreground mr-1">Following</span>
                    </Link>
                    <Link href={`/${profile.username}/followers`} className="flex items-center gap-1 hover:underline cursor-pointer transition-colors">
                        <span className="font-bold text-foreground">{profile.followers.toLocaleString()}</span>
                        <span className="text-muted-foreground mr-1">Followers</span>
                    </Link>
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-foreground">{profile.posts.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-1">Posts</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
