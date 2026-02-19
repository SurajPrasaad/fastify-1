"use client";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Loader2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    bio: z.string().max(160, "Bio must be at most 160 characters").optional(),
    avatarUrl: z.string().url("Invalid URL").or(z.literal("")).optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsProfilePage() {
    const { user, updateProfile, isUpdatingProfile } = useAuth();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            username: "",
            bio: "",
            avatarUrl: "",
        },
    });

    useEffect(() => {
        if (user) {
            reset({
                name: user.name,
                username: user.username,
                bio: user.bio || "",
                avatarUrl: user.avatarUrl || "",
            });
        }
    }, [user, reset]);

    const onSubmit = (data: ProfileFormValues) => {
        updateProfile(data);
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    This is how others will see you on the site.
                </p>
            </div>
            <Separator />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Avatar Section */}
                <div className="flex flex-col gap-4">
                    <Label>Avatar</Label>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border">
                            <AvatarImage src={user.avatarUrl || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2 flex-1 max-w-sm">
                            <Input
                                placeholder="Avatar URL"
                                {...register("avatarUrl")}
                                disabled={isUpdatingProfile}
                            />
                            {errors.avatarUrl && (
                                <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                        id="name"
                        placeholder="Your Name"
                        {...register("name")}
                        disabled={isUpdatingProfile}
                    />
                    {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                </div>

                {/* Username */}
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        placeholder="username"
                        {...register("username")}
                        disabled={isUpdatingProfile}
                    />
                    {errors.username && (
                        <p className="text-sm text-destructive">{errors.username.message}</p>
                    )}
                    <p className="text-[0.8rem] text-muted-foreground">
                        This is your public display name.
                    </p>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                        id="bio"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Tell us a little bit about yourself"
                        {...register("bio")}
                        disabled={isUpdatingProfile}
                    />
                    {errors.bio && (
                        <p className="text-sm text-destructive">{errors.bio.message}</p>
                    )}
                </div>

                {/* Action Bar */}
                <div className="flex justify-start">
                    <Button type="submit" disabled={isUpdatingProfile || !isDirty}>
                        {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update profile
                    </Button>
                </div>
            </form>
        </div>
    );
}
