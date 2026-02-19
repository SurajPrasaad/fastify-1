"use client";

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsPrivacyPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Privacy</h3>
                <p className="text-sm text-muted-foreground">
                    Control who can see your profile and activity.
                </p>
            </div>
            <Separator />

            {/* Account Privacy */}
            <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                    <Label className="text-base">Private Account</Label>
                    <p className="text-sm text-muted-foreground">
                        Only people you approve can see your photos and videos. Your existing followers won't be affected.
                    </p>
                </div>
                <Switch />
            </div>

            <Separator />

            {/* Activity Status */}
            <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                    <Label className="text-base">Activity Status</Label>
                    <p className="text-sm text-muted-foreground">
                        Allow accounts you follow and anyone you message to see when you were last active.
                    </p>
                </div>
                <Switch defaultChecked />
            </div>
        </div>
    );
}
