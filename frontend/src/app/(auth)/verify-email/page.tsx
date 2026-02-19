
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Verify Email',
    description: 'Check your inbox to verify your account',
};

export default function VerifyEmailPage() {
    return (
        <Card className="w-full max-w-sm text-center shadow-lg">
            <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <Mail className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                </div>
                <CardTitle className="text-2xl">Check your inbox</CardTitle>
                <CardDescription>
                    We are sending a verification link to your email.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Click the link in the email to verify your account. If you don't see it, check your spam folder.
                </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button variant="outline" className="w-full">
                    Resend Email
                </Button>
                <Link href="/login" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary">
                    Back to Sign In
                </Link>
            </CardFooter>
        </Card>
    );
}
