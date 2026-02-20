"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Smartphone, ShieldCheck, Globe, Loader2, KeyRound } from "lucide-react";
import { TwoFactorSetup } from "@/features/auth/components/TwoFactorSetup";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { toast } from "sonner";

export default function SettingsSecurityPage() {
    const { user, isLoading } = useAuth();
    const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);

    const is2FAEnabled = user?.auth.twoFactorEnabled;

    const handleToggle2FA = () => {
        if (is2FAEnabled) {
            // Usually disabling requires re-authentication or a specific prompt
            toast.info("To disable 2FA, please contact support or use the recovery flow (Feature coming soon)");
        } else {
            setIsSettingUp2FA(true);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold tracking-tight">Security Settings</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your account security, authentication methods, and active sessions.
                    </p>
                </div>
                <div className="bg-primary/10 p-2 rounded-lg">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
            </div>
            <Separator />

            {isSettingUp2FA ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsSettingUp2FA(false)}>
                            ← Back to Security
                        </Button>
                    </div>
                    <TwoFactorSetup />
                </div>
            ) : (
                <>
                    {/* Two-Factor Auth Tile */}
                    <div className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/50 hover:shadow-sm">
                        <div className="flex items-center justify-between p-6">
                            <div className="flex gap-4">
                                <div className={`p-3 rounded-xl ${is2FAEnabled ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                                    <KeyRound className={`h-6 w-6 ${is2FAEnabled ? 'text-green-500' : 'text-amber-500'}`} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-lg font-semibold cursor-pointer" htmlFor="2fa-toggle">
                                            Two-Factor Authentication
                                        </Label>
                                        {is2FAEnabled && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        {is2FAEnabled
                                            ? "Your account is protected with an extra layer of security. We'll ask for a code when you sign in on a new device."
                                            : "Protect your account from unauthorized access. We'll ask for a code whenever you sign in."}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Switch
                                    id="2fa-toggle"
                                    checked={is2FAEnabled}
                                    onCheckedChange={handleToggle2FA}
                                />
                                {!is2FAEnabled && (
                                    <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setIsSettingUp2FA(true)}>
                                        Setup Now
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Active Sessions Section */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                                Active Sessions ({user?.auth.activeSessionsCount || 1})
                            </h4>
                            <Button variant="ghost" size="sm" className="text-xs">Log out all devices</Button>
                        </div>
                        <div className="grid gap-3">
                            <div className="group flex items-center justify-between p-4 rounded-xl border bg-card/50 transition-colors hover:bg-card">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-lg bg-muted flex items-center justify-center">
                                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Current Device</p>
                                        <p className="text-xs text-muted-foreground tabular-nums">
                                            Last active: {user?.auth.lastLoginAt ? new Date(user.auth.lastLoginAt).toLocaleString() : 'Just now'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-green-500 bg-green-500/5 border border-green-500/10 px-2.5 py-1 rounded-full">
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                        This Device
                                    </div>
                                </div>
                            </div>

                            {/* Placeholder for other sessions */}
                            <div className="group flex items-center justify-between p-4 rounded-xl border bg-card/10 opacity-60">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-lg bg-muted flex items-center justify-center">
                                        <Globe className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Desktop (Chrome/Windows)</p>
                                        <p className="text-xs text-muted-foreground tabular-nums">Recent session</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                    Revoke
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
