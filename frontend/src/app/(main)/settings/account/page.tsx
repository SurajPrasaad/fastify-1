"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Shield, Info, AlertTriangle, CheckCircle2, Crown, Trash2, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const accountSchema = z.object({
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().max(20).optional().nullable(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export default function AccountSettingsPage() {
    const { user, updateProfile, isUpdatingProfile, deactivateAccount, deleteAccount, logout } = useAuth();
    const [showSuccess, setShowSuccess] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<AccountFormValues>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            email: "",
            phoneNumber: "",
        },
    });

    useEffect(() => {
        if (user) {
            reset({
                email: user.email,
                phoneNumber: user.phoneNumber || "",
            });
            setIs2FAEnabled(user.auth?.twoFactorEnabled || false);
        }
    }, [user, reset]);

    const onSubmit = (data: AccountFormValues) => {
        updateProfile(data, {
            onSuccess: () => {
                setShowSuccess(true);
                toast.success("Account information updated");
                setTimeout(() => setShowSuccess(false), 3000);
            }
        });
    };

    const handleDeactivate = () => {
        if (confirm("Are you sure you want to deactivate your account? Your profile and content will be hidden.")) {
            deactivateAccount();
        }
    };

    const handleDelete = () => {
        if (confirm("CRITICAL: Are you sure you want to PERMANENTLY delete your account? This action cannot be undone.")) {
            deleteAccount();
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Helper for "Last changed X months ago"
    const getPasswordAge = () => {
        if (!user.passwordChangedAt) return "Never changed";
        const date = new Date(user.passwordChangedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));

        if (diffMonths === 0) {
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 0) return "Changed today";
            return `Changed ${diffDays} days ago`;
        }
        return `Last changed ${diffMonths} months ago`;
    };

    return (
        <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-10">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Account Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your account credentials, security preferences, and subscription status.</p>
            </header>

            <div className="space-y-8">
                {/* Account Information Section */}
                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Info className="size-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Account Information</h2>
                            <p className="text-sm text-slate-500">Your primary account contact details.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        className={cn(
                                            "w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 dark:text-white",
                                            errors.email && "border-red-500"
                                        )}
                                        {...register("email")}
                                        disabled={isUpdatingProfile}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                        <CheckCircle2 className="size-5" />
                                    </div>
                                </div>
                                {errors.email && <p className="text-xs text-red-500 px-1">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                                <div className="relative group">
                                    <input
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        className={cn(
                                            "w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 dark:text-white",
                                            errors.phoneNumber && "border-red-500"
                                        )}
                                        {...register("phoneNumber")}
                                        disabled={isUpdatingProfile}
                                    />
                                </div>
                                {errors.phoneNumber && <p className="text-xs text-red-500 px-1">{errors.phoneNumber.message}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={isUpdatingProfile || !isDirty}
                                className="px-8 py-3 bg-primary text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                            >
                                {isUpdatingProfile && <Loader2 className="size-4 animate-spin" />}
                                Update Profile
                            </button>
                        </div>
                    </form>
                </section>

                {/* Security Section */}
                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <div className="size-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Shield className="size-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Security</h2>
                            <p className="text-sm text-slate-500">Manage your password and authentication methods.</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Password</h3>
                                <p className="text-sm text-slate-500 mt-1">{getPasswordAge()}</p>
                            </div>
                            <button className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                Change Password
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="max-w-[70%]">
                                <h3 className="font-bold text-slate-900 dark:text-white">Two-factor authentication</h3>
                                <p className="text-sm text-slate-500 mt-1 leading-relaxed">Add an extra layer of security to your account by requiring more than just a password to log in.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={is2FAEnabled}
                                    onChange={() => setIs2FAEnabled(!is2FAEnabled)}
                                    className="sr-only peer"
                                />
                                <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-lg peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Account Status */}
                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                    <div className="p-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <Crown className="size-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Account Status</h2>
                                <p className="text-sm text-slate-500">Current plan: <span className="text-primary font-bold">{user.subscriptionPlan === "PREMIUM_PRO" ? "Premium Pro" : user.subscriptionPlan === "PREMIUM" ? "Premium" : "Free"}</span></p>
                            </div>
                        </div>
                        <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-black tracking-widest rounded-lg">
                            {user.auth?.status?.toUpperCase() || "ACTIVE"}
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="border border-red-500/20 bg-red-50/30 dark:bg-red-950/10 rounded-lg overflow-hidden shadow-sm shadow-red-500/5">
                    <div className="p-8 border-b border-red-500/10 flex items-center gap-4">
                        <div className="size-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                            <AlertTriangle className="size-6" />
                        </div>
                        <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900/60 rounded-lg border border-red-500/10">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    Deactivate Account
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Temporarily hide your profile and content.</p>
                            </div>
                            <button
                                onClick={handleDeactivate}
                                className="px-6 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors font-bold text-sm text-right"
                            >
                                Deactivate
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-red-500/5 rounded-lg border border-red-500/20">
                            <div>
                                <h3 className="font-bold text-red-600 dark:text-red-400">Delete Account</h3>
                                <p className="text-sm text-slate-500 mt-1 font-medium">Permanently remove all your data. This cannot be undone.</p>
                            </div>
                            <button
                                onClick={handleDelete}
                                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                            >
                                <Trash2 className="size-4" />
                                Delete Account
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
