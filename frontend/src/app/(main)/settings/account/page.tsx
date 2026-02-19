"use client";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Lock, Shield } from "lucide-react";

export default function SettingsAccountPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Account</h3>
                <p className="text-sm text-muted-foreground">
                    Update your account settings, including your email and password.
                </p>
            </div>
            <Separator />

            {/* Email Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Email Address</CardTitle>
                    <CardDescription>
                        Your email address is used for logging in and sending you notifications.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Label>Current Email</Label>
                    <div className="flex gap-2">
                        <Input defaultValue="suraj@example.com" disabled />
                        <Button variant="secondary">Change</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Password Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>
                        Change your password or enable 2FA for enhanced security.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Password</Label>
                            <div className="text-sm text-muted-foreground">
                                Last changed 3 months ago
                            </div>
                        </div>
                        <Button variant="outline">Update password</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <div className="border border-destructive/50 rounded-lg p-4 space-y-4 bg-destructive/5">
                <div className="flex items-center gap-2 text-destructive font-semibold">
                    <AlertCircle className="h-5 w-5" />
                    <h3>Danger Zone</h3>
                </div>
                <Alert variant="destructive" className="bg-transparent border-none p-0">
                    <AlertDescription>
                        Once you delete your account, there is no going back. Please be certain.
                    </AlertDescription>
                </Alert>
                <Button variant="destructive">Delete Account</Button>
            </div>
        </div>
    );
}
