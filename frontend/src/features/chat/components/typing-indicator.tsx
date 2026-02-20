import React from 'react';
import { motion } from 'framer-motion';

export function TypingIndicator() {
    return (
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/80 backdrop-blur-md rounded-2xl rounded-tl-none w-fit shadow-lg border border-white/5">
            <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    ease: "easeInOut",
                    delay: 0
                }}
                className="h-1.5 w-1.5 bg-primary rounded-full"
            />
            <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    ease: "easeInOut",
                    delay: 0.15
                }}
                className="h-1.5 w-1.5 bg-primary/70 rounded-full"
            />
            <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    ease: "easeInOut",
                    delay: 0.3
                }}
                className="h-1.5 w-1.5 bg-primary/40 rounded-full"
            />
        </div>
    );
}
