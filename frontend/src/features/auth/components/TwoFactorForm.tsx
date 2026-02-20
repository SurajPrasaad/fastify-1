"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuthActions } from "../hooks";

const mfaSchema = z.object({
    code: z.string().length(6, "Code must be 6 digits"),
});

type MFAFields = z.infer<typeof mfaSchema>;

interface TwoFactorFormProps {
    tempToken: string;
    deviceId: string;
    onCancel: () => void;
}

export function TwoFactorForm({ tempToken, deviceId, onCancel }: TwoFactorFormProps) {
    const { login2FA, isLoggingIn2FA } = useAuthActions();
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<MFAFields>({
        resolver: zodResolver(mfaSchema),
    });

    const onSubmit = async (data: MFAFields) => {
        setError(null);
        try {
            await login2FA({
                tempToken,
                code: data.code,
                deviceId: deviceId,
            });
        } catch (err: any) {
            setError(err.message || "Invalid or expired verification code");
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Two-Factor Auth</CardTitle>
                <CardDescription>
                    Enter the 6-digit code from your authenticator app
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="code" className="sr-only">Verification Code</Label>
                        <Input
                            id="code"
                            placeholder="000000"
                            className="text-center text-2xl tracking-[0.5em] h-14"
                            maxLength={6}
                            {...register("code")}
                        />
                        {errors.code && <p className="text-xs text-center text-destructive">{errors.code.message}</p>}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button type="submit" className="w-full h-11" disabled={isLoggingIn2FA}>
                        {isLoggingIn2FA && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify & Sign In
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
                        Back to Login
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
