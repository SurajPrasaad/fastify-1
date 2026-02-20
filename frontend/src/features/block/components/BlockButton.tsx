"use client";

import { Button } from "@/components/ui/button";
import { useBlock } from "../hooks";
import { Shield, ShieldOff, Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BlockButtonProps {
    userId: string;
    variant?: "default" | "outline" | "destructive" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    showLabel?: boolean;
}

export function BlockButton({
    userId,
    variant = "outline",
    size = "default",
    showLabel = true
}: BlockButtonProps) {
    const { isBlocked, block, unblock, isLoading } = useBlock(userId);

    if (isBlocked) {
        return (
            <Button
                variant="destructive"
                size={size}
                onClick={() => unblock()}
                disabled={isLoading}
                className="gap-2"
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                {showLabel && "Unblock"}
            </Button>
        );
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    disabled={isLoading}
                    className="gap-2"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                    {showLabel && "Block"}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Block User?</AlertDialogTitle>
                    <AlertDialogDescription>
                        They will no longer be able to message you, see your posts, or follow you.
                        They won't be notified that you blocked them.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            block();
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Block
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
