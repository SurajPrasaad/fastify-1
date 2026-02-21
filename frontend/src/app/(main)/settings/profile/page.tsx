"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    bio: z.string().max(250, "Bio must be at most 250 characters").optional(),
    location: z.string().optional(),
    website: z.string().url("Invalid URL").or(z.literal("")).optional(),
    avatarUrl: z.string().url("Invalid URL").or(z.literal("")).optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsProfilePage() {
    const { user, updateProfile, isUpdatingProfile } = useAuth();
    const [showSuccess, setShowSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
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
        },
    });

    const bioValue = watch("bio") || "";

    useEffect(() => {
        if (user) {
            reset({
                name: user.name,
                username: user.username,
                bio: user.bio || "",
                location: "San Francisco, CA", // Default placeholder
                website: "https://alexj.design", // Default placeholder
                avatarUrl: user.avatarUrl || "",
            });
        }
    }, [user, reset]);

    const onSubmit = (data: ProfileFormValues) => {
        updateProfile(data, {
            onSuccess: () => {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 5000);
            }
        });
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 rounded-xl px-6 py-4">
                        <div className="bg-emerald-500 rounded-full p-1 flex">
                            <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">Profile Saved Successfully</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your public profile information has been updated.</p>
                        </div>
                        <button onClick={() => setShowSuccess(false)} className="ml-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                </div>
            )}

            <header className="mb-10">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Profile Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Manage how you appear to others on the SocialApp platform.</p>
            </header>

            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="p-8 lg:p-10 space-y-10">
                        {/* Avatar Section */}
                        <section className="flex flex-col md:flex-row md:items-center gap-8 border-b border-slate-100 dark:border-slate-800 pb-10">
                            <div className="relative group shrink-0">
                                <img
                                    className="w-24 h-24 lg:w-32 lg:h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-lg object-cover"
                                    src={user.avatarUrl || "https://api.dicebear.com/7.x/beta/svg?seed=Alex"}
                                    alt={user.name}
                                />
                                <button type="button" className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-white">photo_camera</span>
                                </button>
                            </div>
                            <div className="flex-1 space-y-3">
                                <h3 className="text-lg font-bold">Your Profile Picture</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                                    We recommend an image of at least 400x400. Gifs and static images are supported.
                                </p>
                                <div className="flex gap-3 pt-1">
                                    <button type="button" className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                                        Change avatar
                                    </button>
                                    <button type="button" className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Fields Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <SettingsInput
                                label="Full Name"
                                icon="badge"
                                register={register("name")}
                                error={errors.name?.message}
                                placeholder="Enter your full name"
                                disabled={isUpdatingProfile}
                            />
                            <SettingsInput
                                label="Username"
                                icon="alternate_email"
                                register={register("username")}
                                error={errors.username?.message}
                                placeholder="username"
                                disabled={isUpdatingProfile}
                            />
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Bio</label>
                                <textarea
                                    className={cn(
                                        "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white resize-none text-[15px]",
                                        errors.bio && "border-red-500"
                                    )}
                                    placeholder="Write something about yourself..."
                                    rows={4}
                                    {...register("bio")}
                                    disabled={isUpdatingProfile}
                                />
                                <div className="flex justify-between items-center px-1">
                                    {errors.bio ? (
                                        <p className="text-xs text-red-500">{errors.bio.message}</p>
                                    ) : (
                                        <div />
                                    )}
                                    <p className="text-xs text-slate-500">{bioValue.length} / 250 characters</p>
                                </div>
                            </div>
                            <SettingsInput
                                label="Website"
                                icon="link"
                                type="url"
                                register={register("website")}
                                error={errors.website?.message}
                                placeholder="https://yourwebsite.com"
                                disabled={isUpdatingProfile}
                            />
                            <SettingsInput
                                label="Location"
                                icon="location_on"
                                register={register("location")}
                                error={errors.location?.message}
                                placeholder="City, Country"
                                disabled={isUpdatingProfile}
                            />
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-4">
                        <button type="button" onClick={() => reset()} className="px-6 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdatingProfile || !isDirty}
                            className="px-10 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                        >
                            {isUpdatingProfile && <Loader2 className="size-4 animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>

            {/* Secondary Info Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl group hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary">visibility</span>
                        <h4 className="font-bold">Privacy Control</h4>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        Control who can see your bio and location on your public profile. These settings can be adjusted in the Privacy tab.
                    </p>
                </div>
                <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl group hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary">verified_user</span>
                        <h4 className="font-bold">Verification</h4>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        Apply for a verified badge to let others know that your profile is authentic. Requires a valid business ID.
                    </p>
                </div>
            </div>
        </div>
    );
}

function SettingsInput({ label, icon, register, error, placeholder, disabled, type = "text" }: any) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{label}</label>
            <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] group-focus-within:text-primary transition-colors">
                    {icon}
                </span>
                <input
                    type={type}
                    className={cn(
                        "w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 dark:text-white text-[15px]",
                        error && "border-red-500 focus:ring-red-500/10"
                    )}
                    placeholder={placeholder}
                    {...register}
                    disabled={disabled}
                />
            </div>
            {error && <p className="text-xs text-red-500 px-1">{error}</p>}
        </div>
    );
}
