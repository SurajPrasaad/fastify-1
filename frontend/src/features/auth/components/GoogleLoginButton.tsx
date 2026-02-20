"use client";

import { Button } from "@/components/ui/button";
import { Chrome, Loader2 } from "lucide-react";
import { useAuthActions } from "../hooks";
import { toast } from "sonner";

interface GoogleLoginButtonProps {
    deviceId: string;
}

export function GoogleLoginButton({ deviceId }: GoogleLoginButtonProps) {
    const { googleLogin, isGoogleLoggingIn } = useAuthActions();

    const handleGoogleLogin = async () => {
        // In a real flow, you'd use @react-oauth/google or firebase/auth
        // This is a simulation of getting the idToken from Google
        toast.info("Google OAuth popup would trigger here");

        // For demonstration purposes, we'll assume the user canceled or it's a mock
        // If we had a token, we'd call: 
        // await googleLogin({ idToken: "...", deviceId });
    };

    return (
        <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoggingIn}
        >
            {isGoogleLoggingIn ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Chrome className="mr-2 h-4 w-4" />
            )}
            Continue with Google
        </Button>
    );
}
