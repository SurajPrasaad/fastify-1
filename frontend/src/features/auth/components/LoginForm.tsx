"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuthActions } from "../hooks";
import { TwoFactorForm } from "./TwoFactorForm";
import { GoogleLoginButton } from "./GoogleLoginButton";
import Link from "next/link";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginFields = z.infer<typeof loginSchema>;

export function LoginForm() {
    const { login, isLoggingIn } = useAuthActions();
    const [show2FA, setShow2FA] = useState(false);
    const [tempToken, setTempToken] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let id = localStorage.getItem("device_id");
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem("device_id", id);
        }
        setDeviceId(id);
    }, []);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFields) => {
        setError(null);
        try {
            const response = await login({ ...data, deviceId });
            if (response.mfaRequired && response.tempToken) {
                setTempToken(response.tempToken);
                setShow2FA(true);
            }
        } catch (err: any) {
            setError(err.message || "Invalid credentials");
        }
    };

    if (show2FA && tempToken) {
        return (
            <TwoFactorForm
                tempToken={tempToken}
                deviceId={deviceId}
                onCancel={() => setShow2FA(false)}
            />
        );
    }

    return (
        <Card className="w-full">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                <CardDescription>
                    Enter your credentials to access your account
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <GoogleLoginButton deviceId={deviceId} />

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="m@example.com" {...register("email")} />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link href="/forgot-password" title="Coming soon">
                                <span className="text-xs text-muted-foreground hover:underline">Forgot password?</span>
                            </Link>
                        </div>
                        <Input id="password" type="password" {...register("password")} />
                        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={isLoggingIn}>
                        {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-primary hover:underline font-medium">
                            Join now
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
