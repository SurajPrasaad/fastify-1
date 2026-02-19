"use client";

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsNotificationsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                    Configure how you receive notifications.
                </p>
            </div>
            <Separator />

            {/* Push Notifications */}
            <div>
                <h4 className="mb-4 text-sm font-medium">Global Settings</h4>
                <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="push" className="flex flex-col space-y-1">
                            <span>Push Notifications</span>
                            <span className="font-normal text-xs text-muted-foreground">Receive push notifications on your device.</span>
                        </Label>
                        <Switch id="push" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="email" className="flex flex-col space-y-1">
                            <span>Email Notifications</span>
                            <span className="font-normal text-xs text-muted-foreground">Receive notifications via email.</span>
                        </Label>
                        <Switch id="email" />
                    </div>
                </div>
            </div>

            <Separator />

            {/* Quiet Hours */}
            <div>
                <h4 className="mb-4 text-sm font-medium">Quiet Hours</h4>
                <p className="text-sm text-muted-foreground mb-4">
                    Temporarily silence notifications during specific times.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="quiet-start">Start Time</Label>
                        <input
                            id="quiet-start"
                            type="time"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            defaultValue="22:00"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="quiet-end">End Time</Label>
                        <input
                            id="quiet-end"
                            type="time"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            defaultValue="07:00"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
