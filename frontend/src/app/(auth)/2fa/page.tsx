
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export const metadata: Metadata = {
    title: 'Two-Factor Authentication',
    description: 'Enter your 2FA code',
};

export default function TwoFactorAuthPage() {
    return (
        <Card className="w-full max-w-sm shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
                <CardDescription>
                    Enter the code from your authenticator app.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="code">Authentication Code</Label>
                    <Input id="code" type="text" placeholder="123456" className="text-center text-lg tracking-widest" maxLength={6} />
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="trust-device" />
                    <label
                        htmlFor="trust-device"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Don't ask again on this device for 30 days
                    </label>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button className="w-full">Verify</Button>
                <Link href="/login" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary">
                    Use a backup code
                </Link>
            </CardFooter>
        </Card>
    );
}
