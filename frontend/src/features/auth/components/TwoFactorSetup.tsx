"use client";

import { useState } from "react";
import { use2FA } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, ShieldCheck, QrCode, Clipboard } from "lucide-react";
import { toast } from "sonner";

export function TwoFactorSetup() {
    const { setup, verify, isSettingUp, isVerifying } = use2FA();
    const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
    const [code, setCode] = useState("");

    const handleStartSetup = async () => {
        try {
            const data = await setup();
            setSetupData(data);
        } catch (err: any) {
            toast.error(err.message || "Failed to start 2FA setup");
        }
    };

    const handleVerify = async () => {
        try {
            await verify(code);
            setSetupData(null);
            setCode("");
            // In real app, might want to refresh user data
        } catch (err: any) {
            toast.error(err.message || "Invalid verification code");
        }
    };

    if (!setupData) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <CardTitle>Two-Factor Authentication</CardTitle>
                    </div>
                    <CardDescription>
                        Add an extra layer of security to your account by requiring a verification code when you sign in.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button onClick={handleStartSetup} disabled={isSettingUp}>
                        {isSettingUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enable 2FA
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configure Authenticator App</CardTitle>
                <CardDescription>
                    Scan the QR code below using an authenticator app like Google Authenticator or Authy.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="bg-white p-4 rounded-lg shadow-inner">
                        {/* Note: This assumes backend returns a data URL or similar for the QR code */}
                        <div className="w-48 h-48 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center relative overflow-hidden">
                            <img src={setupData.qrCode} alt="2FA QR Code" className="w-full h-full object-contain" />
                            {!setupData.qrCode && <QrCode className="h-12 w-12 text-muted-foreground/40" />}
                        </div>
                    </div>

                    <div className="w-full space-y-2">
                        <p className="text-sm font-medium">Or enter code manually:</p>
                        <div className="flex gap-2">
                            <code className="flex-1 bg-muted p-2 rounded text-xs break-all font-mono border">
                                {setupData.secret}
                            </code>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    navigator.clipboard.writeText(setupData.secret);
                                    toast.success("Secret copied to clipboard");
                                }}
                            >
                                <Clipboard className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium">Verification Code</p>
                    <Input
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="text-center text-lg tracking-widest"
                        maxLength={6}
                    />
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button className="flex-1" onClick={handleVerify} disabled={isVerifying || code.length !== 6}>
                    {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Finish Setup
                </Button>
                <Button variant="ghost" onClick={() => setSetupData(null)}>Cancel</Button>
            </CardFooter>
        </Card>
    );
}
