"use client"

import React from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, AlertTriangle } from 'lucide-react'

interface ConfirmEndSpaceModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    isLoading?: boolean
}

export function ConfirmEndSpaceModal({ isOpen, onClose, onConfirm, isLoading }: ConfirmEndSpaceModalProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="bg-[#000000] border-[#2f3336] text-[#e7e9ea] rounded-3xl sm:max-w-[400px] p-6">
                <AlertDialogHeader className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="space-y-2 text-center">
                        <AlertDialogTitle className="text-xl font-bold">End this Space?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#71767b] text-sm">
                            This will end the conversation for everyone. This action cannot be undone.
                        </AlertDialogDescription>
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-col gap-2 mt-6">
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-full py-6 font-bold text-base transition-all active:scale-[0.98] border-none"
                    >
                        {isLoading ? "Ending..." : "End Space"}
                    </AlertDialogAction>
                    <AlertDialogCancel
                        disabled={isLoading}
                        className="w-full bg-transparent border-[#2f3336] hover:bg-[#16181c] text-[#e7e9ea] rounded-full py-6 font-bold text-base mt-2 sm:mt-0"
                    >
                        Cancel
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
