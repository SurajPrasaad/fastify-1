"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEmailVerification } from "@/features/auth/hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const { verify, isVerifying } = useEmailVerification();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link.");
            return;
        }

        const runVerification = async () => {
            try {
                const res = await verify(token);
                setStatus("success");
                setMessage(res.message || "Email verified successfully!");
                // Auto redirect after 3 seconds
                setTimeout(() => router.push("/login"), 3000);
            } catch (err: any) {
                setStatus("error");
                setMessage(err.message || "Verification failed. Link may be expired.");
            }
        };

        runVerification();
    }, [token, verify, router]);

    return (
        <Card className="w-full text-center">
            <CardContent className="pt-10 space-y-4">
                {status === "loading" && (
                    <>
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <CardTitle>Verifying your email...</CardTitle>
                        <CardDescription>Please wait while we validate your link</CardDescription>
                    </>
                )}

                {status === "success" && (
                    <>
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                        <CardTitle>Verified!</CardTitle>
                        <CardDescription>{message}</CardDescription>
                        <p className="text-sm text-muted-foreground">Redirecting to login...</p>
                        <Button asChild className="w-full">
                            <Link href="/login">Login Now</Link>
                        </Button>
                    </>
                )}

                {status === "error" && (
                    <>
                        <XCircle className="h-12 w-12 text-destructive mx-auto" />
                        <CardTitle>Verification Failed</CardTitle>
                        <CardDescription className="text-destructive font-medium">{message}</CardDescription>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/login">Back to Login</Link>
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
