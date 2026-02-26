"use client";

import React from "react";
import { useSecurity } from "@/hooks/use-user";
import {
    Loader2, Shield, Lock, Smartphone, Laptop, Monitor,
    Globe, Key, Trash2, LogOut, ExternalLink,
    ChevronRight, AlertTriangle, Copy, CheckCircle2, QrCode
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { UAParser } from "ua-parser-js";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { toast } from "sonner";

export default function SecuritySettingsPage() {
    const {
        security,
        isLoading,
        revokeSession,
        isRevokingSession,
        revokeApp,
        isRevokingApp,
        setup2FA,
        isSettingUp2FA,
        verify2FA,
        isVerifying2FA,
        changePassword,
        isChangingPassword
    } = useSecurity();

    const [show2FAModal, setShow2FAModal] = React.useState(false);
    const [showPasswordModal, setShowPasswordModal] = React.useState(false);
    const [setupData, setSetupData] = React.useState<{ secret: string; qrCodeUrl: string } | null>(null);
    const [verificationCode, setVerificationCode] = React.useState("");

    const [passwords, setPasswords] = React.useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const { passwordMetadata, mfaStatus, sessions, connectedApps } = security || {};

    const getDeviceIcon = (userAgent: string) => {
        const parser = new UAParser(userAgent);
        const device = parser.getDevice().type;
        if (device === 'mobile') return <Smartphone className="size-5" />;
        if (device === 'tablet') return <Smartphone className="size-5" />;
        return <Laptop className="size-5" />;
    };

    const formatUA = (userAgent: string) => {
        const parser = new UAParser(userAgent);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        return `${browser.name || 'Unknown Browser'} on ${os.name || 'Unknown OS'}`;
    };

    return (
        <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <header className="mb-10">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Security Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your password, login sessions, and account integrations.</p>
            </header>

            <div className="space-y-10">
                {/* Password Section */}
                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                    <div className="p-8 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Key className="size-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Password</h2>
                                <p className="text-sm text-slate-500">
                                    Last changed {passwordMetadata?.lastChangedAt
                                        ? formatDistanceToNow(new Date(passwordMetadata.lastChangedAt), { addSuffix: true })
                                        : "never"}
                                </p>
                            </div>
                        </div>
                        <Button
                            className="rounded-lg font-bold px-6 shadow-lg shadow-primary/20"
                            onClick={() => setShowPasswordModal(true)}
                        >
                            Change Password
                        </Button>
                    </div>
                </section>

                {/* Change Password Modal */}
                <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                    <DialogContent className="sm:max-w-md rounded-lg overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
                        <DialogHeader>
                            <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
                                <Lock className="size-6" />
                            </div>
                            <DialogTitle className="text-2xl font-black tracking-tight">Change Password</DialogTitle>
                            <DialogDescription className="text-slate-500 dark:text-slate-400">
                                Enter your current password and a new secure password.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="rounded-lg h-12 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-primary/20"
                                    value={passwords.currentPassword}
                                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">New Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="rounded-lg h-12 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-primary/20"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-500 px-1">Must be at least 8 chars with 1 uppercase and 1 number</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Confirm New Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="rounded-lg h-12 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-primary/20"
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter className="bg-slate-50/50 dark:bg-slate-900/50 -mx-6 -mb-6 p-6 flex flex-row items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                            <Button
                                variant="ghost"
                                className="rounded-lg font-bold h-12"
                                onClick={() => setShowPasswordModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="rounded-lg font-bold h-12 px-8 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                                disabled={!passwords.currentPassword || !passwords.newPassword || passwords.newPassword !== passwords.confirmPassword || isChangingPassword}
                                onClick={async () => {
                                    try {
                                        await changePassword({
                                            currentPassword: passwords.currentPassword,
                                            newPassword: passwords.newPassword
                                        });
                                        setShowPasswordModal(false);
                                        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                    } catch (error) {
                                        // Error handled by mutation
                                    }
                                }}
                            >
                                {isChangingPassword && <Loader2 className="size-4 animate-spin mr-2" />}
                                Update Password
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 2FA Section */}
                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                    <div className="p-8 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <Shield className="size-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Two-factor authentication</h2>
                                <p className="text-sm text-slate-500">Add an extra layer of security to your account.</p>
                            </div>
                        </div>
                        <Switch
                            checked={mfaStatus?.isEnabled}
                            onCheckedChange={async (checked) => {
                                if (checked) {
                                    try {
                                        const data = await setup2FA();
                                        setSetupData(data);
                                        setShow2FAModal(true);
                                    } catch (error) {
                                        // Error handled by mutation toast
                                    }
                                } else {
                                    // Handle disable 2FA logic if needed
                                    toast.info("Disabling 2FA requires confirmation (Not implemented yet)");
                                }
                            }}
                        />
                    </div>
                </section>

                {/* 2FA Setup Modal */}
                <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
                    <DialogContent className="sm:max-w-xl rounded-lg overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-0 gap-0 shadow-2xl">
                        <div className="bg-gradient-to-br from-primary/5 via-transparent to-transparent p-8">
                            <DialogHeader>
                                <div className="size-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                                    <QrCode className="size-8" />
                                </div>
                                <DialogTitle className="text-3xl font-black tracking-tight">Two-Factor Auth</DialogTitle>
                                <DialogDescription className="text-slate-500 dark:text-slate-400 text-base mt-2">
                                    Secure your account by linking an authenticator app.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 items-center">
                                {/* Left Side: QR Code */}
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    {setupData?.qrCodeUrl ? (
                                        <div className="relative group">
                                            <div className="absolute -inset-4 bg-primary/20 rounded-lg blur-2xl opacity-50 group-hover:opacity-100 transition duration-500" />
                                            <div className="relative p-3 bg-white rounded-lg border border-slate-100 dark:border-slate-800 shadow-xl">
                                                <Image
                                                    src={setupData.qrCodeUrl}
                                                    alt="2FA QR Code"
                                                    width={180}
                                                    height={180}
                                                    className="rounded-lg"
                                                    unoptimized
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="size-[200px] bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-lg flex items-center justify-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                                        </div>
                                    )}
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center px-4">
                                        Scan this code with your app
                                    </p>
                                </div>

                                {/* Right Side: Instructions & Secret */}
                                <div className="space-y-6 text-sm">
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">1</span>
                                            Get the app
                                        </h3>
                                        <p className="text-slate-500 leading-relaxed">Download Google Authenticator or Authy from your app store.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">2</span>
                                            Enter key manually
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between gap-3 group">
                                                <code className="text-[11px] font-mono font-bold text-primary truncate max-w-[140px] block uppercase tracking-wider">
                                                    {setupData?.secret}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary shrink-0"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(setupData?.secret || "");
                                                        toast.success("Secret key copied!");
                                                    }}
                                                >
                                                    <Copy className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent my-2" />

                            <div className="pt-6 space-y-4">
                                <div className="text-center space-y-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white tracking-tight">Verify Code</h3>
                                    <p className="text-xs text-slate-500">Enter the 6-digit code from your app below</p>
                                </div>
                                <div className="max-w-[280px] mx-auto relative group">
                                    <Input
                                        placeholder="000 000"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        className={cn(
                                            "rounded-lg h-16 text-center text-3xl font-black border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all",
                                            verificationCode.length > 0 && "tracking-[0.5em] pl-[0.5em]"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                            <Button
                                variant="ghost"
                                className="rounded-lg font-bold h-12 px-6"
                                onClick={() => {
                                    setShow2FAModal(false);
                                    setVerificationCode("");
                                }}
                            >
                                Not now
                            </Button>
                            <Button
                                className="rounded-lg font-bold h-12 px-10 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                                disabled={verificationCode.length !== 6 || isVerifying2FA}
                                onClick={async () => {
                                    try {
                                        await verify2FA(verificationCode);
                                        setShow2FAModal(false);
                                        setSetupData(null);
                                        setVerificationCode("");
                                    } catch (error) {
                                        // Error handled by mutation
                                    }
                                }}
                            >
                                {isVerifying2FA ? (
                                    <Loader2 className="size-5 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle2 className="size-5 mr-2" />
                                )}
                                Activate 2FA
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Login Activity */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <Monitor className="size-5 text-primary" />
                        <h2 className="text-xl font-bold">Login Activity</h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                        {sessions?.map((session: any) => (
                            <div key={session.id} className="p-6 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                                        {getDeviceIcon(session.userAgent || '')}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                {formatUA(session.userAgent || '')}
                                            </p>
                                            {session.isCurrent && (
                                                <Badge className="bg-green-500/10 text-green-500 border-none font-black text-[10px] uppercase tracking-wider h-5">
                                                    Current
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            {session.ipAddress || 'Unknown IP'} • {formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                                {!session.isCurrent && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg font-bold"
                                        onClick={() => revokeSession(session.id)}
                                    >
                                        Log out
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Connected Apps */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <Globe className="size-5 text-primary" />
                        <h2 className="text-xl font-bold">Connected Apps</h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                        {connectedApps && connectedApps.length > 0 ? (
                            connectedApps.map((app: any) => (
                                <div key={app.id} className="p-6 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors uppercase font-black text-xs">
                                            {app.provider.slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white capitalize">
                                                {app.provider.toLowerCase()} API Integration
                                            </p>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                Full access to profile information
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg font-bold"
                                        onClick={() => revokeApp(app.id)}
                                    >
                                        Revoke Access
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <p className="text-slate-500 font-medium">No connected apps found.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
