"use client"

import React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface LogoProps {
    className?: string
    showText?: boolean
    size?: number
}

export function Logo({ className, showText = true, size = 40 }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div
                className="relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-[#1d9bf0] shadow-lg shadow-primary/20"
                style={{ width: size, height: size }}
            >
                <Image
                    src="/images/logo.png"
                    alt="Dev Atlas Logo"
                    width={size}
                    height={size}
                    className="object-cover transform hover:scale-110 transition-transform duration-300"
                />
            </div>
            {showText && (
                <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Dev Atlas
                </span>
            )}
        </div>
    )
}
