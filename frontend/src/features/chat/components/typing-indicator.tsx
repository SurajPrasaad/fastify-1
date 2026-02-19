import React from 'react';
import { motion } from 'framer-motion';

export function TypingIndicator() {
    return (
        <div className="flex items-center gap-1 px-3 py-2 bg-[#005c4b] rounded-[18px] rounded-tl-none w-fit shadow-md border border-white/5">
            <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                className="h-1.5 w-1.5 bg-[#e9edef]/60 rounded-full"
            />
            <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                className="h-1.5 w-1.5 bg-[#e9edef]/60 rounded-full"
            />
            <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                className="h-1.5 w-1.5 bg-[#e9edef]/60 rounded-full"
            />
        </div>
    );
}
