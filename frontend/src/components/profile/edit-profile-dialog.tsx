"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    bio: z.string().max(160, "Bio must be at most 160 characters").optional(),
    avatarUrl: z.string().url("Invalid URL").or(z.literal("")).optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileDialogProps {
    trigger?: React.ReactNode;
}

export function EditProfileDialog({ trigger }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const { user, updateProfile, isUpdatingProfile } = useAuth();
    const queryClient = useQueryClient();

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

    // Sync form with user data when dialog opens
    useEffect(() => {
        if (open && user) {
            reset({
                name: user.name,
                username: user.username,
                bio: user.bio || "",
                avatarUrl: user.avatarUrl || "",
            });
        }
    }, [open, user, reset]);

    const onSubmit = async (data: ProfileFormValues) => {
        try {
            updateProfile(data, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
                    if (user) {
                        queryClient.invalidateQueries({ queryKey: ["profile", user.username] });
                    }
                    if (data.username !== user?.username) {
                        // If username changed, we might need to redirect, 
                        // but for now let's just invalidate.
                        queryClient.invalidateQueries({ queryKey: ["profile", data.username] });
                    }
                    setOpen(false);
                },
                onError: () => {
                    toast.error("Failed to update profile");
                }
            });
        } catch (error) {
            toast.error("An unexpected error occurred");
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Edit Profile</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                    {/* Avatar Preview & URL */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-2 border-primary/10">
                                <AvatarImage src={user.avatarUrl || undefined} />
                                <AvatarFallback className="text-xl">
                                    {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="w-full space-y-2">
                            <Label htmlFor="avatarUrl">Avatar URL</Label>
                            <Input
                                id="avatarUrl"
                                placeholder="https://example.com/avatar.jpg"
                                {...register("avatarUrl")}
                                disabled={isUpdatingProfile}
                                className="h-9"
                            />
                            {errors.avatarUrl && (
                                <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            placeholder="Your Name"
                            {...register("name")}
                            disabled={isUpdatingProfile}
                        />
                        {errors.name && (
                            <p className="text-xs text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Username */}
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            placeholder="username"
                            {...register("username")}
                            disabled={isUpdatingProfile}
                        />
                        {errors.username && (
                            <p className="text-xs text-destructive">{errors.username.message}</p>
                        )}
                    </div>

                    {/* Bio */}
                    <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <textarea
                            id="bio"
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            placeholder="Tell us about yourself..."
                            {...register("bio")}
                            disabled={isUpdatingProfile}
                        />
                        {errors.bio && (
                            <p className="text-xs text-destructive">{errors.bio.message}</p>
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={isUpdatingProfile}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isUpdatingProfile || !isDirty}>
                            {isUpdatingProfile && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
