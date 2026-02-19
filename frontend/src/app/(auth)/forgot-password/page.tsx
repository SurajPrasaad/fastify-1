
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const metadata: Metadata = {
    title: 'Forgot Password',
    description: 'Reset your password',
};

export default function ForgotPasswordPage() {
    return (
        <Card className="w-full max-w-sm shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl">Forgot Password</CardTitle>
                <CardDescription>
                    Enter your email address and we will send you a link to reset your password.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@example.com" />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button className="w-full">Send Reset Link</Button>
                <div className="text-center text-sm text-muted-foreground">
                    <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                        Back to Sign In
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
