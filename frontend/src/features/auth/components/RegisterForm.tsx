"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuthActions } from "../hooks";
import Link from "next/link";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string().min(3, "Username must be at least 3 characters").max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string().email("Invalid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterFields = z.infer<typeof registerSchema>;

export function RegisterForm() {
    const { register: registerUser, isRegistering } = useAuthActions();
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFields>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFields) => {
        setError(null);
        try {
            await registerUser(data);
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || "An error occurred during registration");
        }
    };

    if (isSuccess) {
        return (
            <Card className="w-full">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="flex justify-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </div>
                    <CardTitle>Check your inbox</CardTitle>
                    <CardDescription>
                        We&apos;ve sent a verification link to your email address.
                        Please verify your email to complete your registration.
                    </CardDescription>
                    <Button asChild className="w-full">
                        <Link href="/login">Go to Login</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                <CardDescription>
                    Fill in your details to get started
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-3">
                    {error && (
                        <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" placeholder="John Doe" {...register("name")} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" placeholder="johndoe" {...register("username")} />
                            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="m@example.com" {...register("email")} />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" {...register("password")} />
                            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm</Label>
                            <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
                            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 pt-2">
                    <Button type="submit" className="w-full" disabled={isRegistering}>
                        {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
