"use client";

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, ShieldCheck, Github, Globe } from "lucide-react";

export default function SettingsSecurityPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Security</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your security preferences and active sessions.
                </p>
            </div>
            <Separator />

            {/* Two-Factor Auth */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        <Label className="text-base">Two-factor Authentication</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account.
                    </p>
                </div>
                <Switch />
            </div>

            {/* Active Sessions */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium">Active Sessions</h4>
                <div className="rounded-md border">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-muted p-2 rounded-full">
                                <Smartphone className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">iPhone 14 Pro</p>
                                <p className="text-xs text-muted-foreground">Just now</p>
                            </div>
                        </div>
                        <div className="text-xs text-green-500 font-medium bg-green-500/10 px-2 py-1 rounded-full">
                            Current
                        </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between p-4 bg-muted/20">
                        <div className="flex items-center gap-4">
                            <div className="bg-muted p-2 rounded-full">
                                <Globe className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Chrome on Windows</p>
                                <p className="text-xs text-muted-foreground">2 days ago</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            Revoke
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
