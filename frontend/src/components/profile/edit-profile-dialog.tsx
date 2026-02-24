"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpload } from "@/hooks/use-upload";
import { useRef } from "react";

import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    bio: z.string().max(160, "Bio must be at most 160 characters").optional(),
    location: z.string().optional(),
    website: z.string().optional(),
    avatarUrl: z.string().url("Invalid URL").or(z.literal("")).optional().nullable(),
    coverUrl: z.string().url("Invalid URL").or(z.literal("")).optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileDialogProps {
    trigger?: React.ReactNode;
}

export function EditProfileDialog({ trigger }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const { user, updateProfile, isUpdatingProfile } = useAuth();
    const queryClient = useQueryClient();
    const { upload, isUploading } = useUpload();
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isDirty },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            username: "",
            bio: "",
            location: "",
            website: "",
            avatarUrl: "",
            coverUrl: "",
        },
    });

    const avatarUrl = watch("avatarUrl");
    const coverUrl = watch("coverUrl");

    useEffect(() => {
        if (open && user) {
            reset({
                name: user.name,
                username: user.username,
                bio: user.bio || "",
                location: user.location || "",
                website: user.website || "",
                avatarUrl: user.avatarUrl || "",
                coverUrl: user.coverUrl || "",
            });
        }
    }, [open, user, reset]);

    const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = await upload(file, "avatars");
        if (url) {
            setValue("avatarUrl", url, { shouldDirty: true });
        }
    };

    const onCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = await upload(file, "covers");
        if (url) {
            setValue("coverUrl", url, { shouldDirty: true });
        }
    };

    const onSubmit = async (data: ProfileFormValues) => {
        try {
            updateProfile(data, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
                    if (user) {
                        queryClient.invalidateQueries({ queryKey: ["profile", user.username] });
                    }
                    toast.success("Profile updated successfully");
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
                {trigger || (
                    <button className="px-6 py-2 rounded-full border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        Edit Profile
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-[600px] p-0 overflow-hidden border-slate-200 dark:border-slate-800 bg-background-light dark:bg-background-dark max-h-[90vh] flex flex-col rounded-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <header className="flex items-center justify-between px-4 py-3 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-30 border-b border-slate-200 dark:border-slate-800 transition-all">
                        <div className="flex items-center gap-6">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="size-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                            <h2 className="text-xl font-bold tracking-tight">Edit Profile</h2>
                        </div>
                        <button
                            type="submit"
                            disabled={isUpdatingProfile || !isDirty}
                            className="bg-primary hover:bg-primary/90 text-white font-bold py-1.5 px-6 rounded-full transition-all text-sm shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                        >
                            {isUpdatingProfile && <Loader2 className="size-4 animate-spin" />}
                            Save
                        </button>
                    </header>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto hidden-scrollbar flex-1 pb-8">
                        {/* Media Section */}
                        <div className="relative mb-4">
                            {/* Cover Photo Update */}
                            <div className="h-48 w-full bg-slate-800 relative group overflow-hidden">
                                {coverUrl && (
                                    <div
                                        className="w-full h-full bg-cover bg-center transition-transform group-hover:scale-105 duration-700"
                                        style={{ backgroundImage: `url('${coverUrl}')` }}
                                    />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/20 group-hover:bg-black/30 transition-all">
                                    <button
                                        type="button"
                                        onClick={() => coverInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="size-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors border border-white/20"
                                    >
                                        <span className="material-symbols-outlined">add_a_photo</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setValue("coverUrl", "", { shouldDirty: true })}
                                        className="size-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors border border-white/20"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    ref={coverInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={onCoverChange}
                                />
                            </div>

                            {/* Avatar Update */}
                            <div className="px-6 relative -mt-14">
                                <div className="size-28 rounded-full border-4 border-background-light dark:border-background-dark bg-slate-200 overflow-hidden relative group shadow-xl">
                                    <img
                                        alt="Avatar preview"
                                        className="w-full h-full object-cover"
                                        src={avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${user.username}`}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all cursor-pointer">
                                        <button
                                            type="button"
                                            onClick={() => avatarInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="size-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors border border-white/20"
                                        >
                                            {isUploading ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                                            )}
                                        </button>
                                    </div>
                                    <input
                                        type="file"
                                        ref={avatarInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={onAvatarChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Form Inputs */}
                        <div className="px-6 flex flex-col gap-6">
                            <FormField
                                id="name"
                                label="Name"
                                register={register("name")}
                                error={errors.name?.message}
                                disabled={isUpdatingProfile}
                            />

                            <div className="relative group">
                                <label className="absolute left-4 top-2 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-primary transition-colors">Bio</label>
                                <textarea
                                    className={cn(
                                        "w-full bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl pt-7 pb-4 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none min-h-[120px] text-[15px] leading-relaxed",
                                        errors.bio && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    )}
                                    {...register("bio")}
                                    disabled={isUpdatingProfile}
                                />
                                {errors.bio && <p className="mt-1 ml-2 text-xs text-red-500 font-medium">{errors.bio.message}</p>}
                            </div>

                            <FormField
                                id="location"
                                label="Location"
                                register={register("location")}
                                error={errors.location?.message}
                                disabled={isUpdatingProfile}
                            />

                            <FormField
                                id="website"
                                label="Website"
                                register={register("website")}
                                error={errors.website?.message}
                                disabled={isUpdatingProfile}
                            />
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function FormField({ id, label, register, error, disabled, type = "text" }: {
    id: string;
    label: string;
    register: any;
    error?: string;
    disabled?: boolean;
    type?: string;
}) {
    return (
        <div className="relative group">
            <label
                htmlFor={id}
                className="absolute left-4 top-2 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-primary transition-colors"
            >
                {label}
            </label>
            <input
                id={id}
                type={type}
                className={cn(
                    "w-full bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl pt-7 pb-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-[15px]",
                    error && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                )}
                {...register}
                disabled={disabled}
            />
            {error && <p className="mt-1 ml-2 text-xs text-red-500 font-medium">{error}</p>}
        </div>
    );
}
