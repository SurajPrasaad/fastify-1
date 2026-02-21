
import { useState, useRef, useCallback } from 'react';

/**
 * Hook for managing local typing state and notifying the server
 */
export const useTypingIndicator = (onStatusChange: (isTyping: boolean) => void) => {
    const [isTyping, setIsTyping] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const setTyping = useCallback((typing: boolean) => {
        if (typing === isTyping) {
            // If we are already typing, just reset the timer
            if (typing && timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => {
                    setIsTyping(false);
                    onStatusChange(false);
                }, 3000);
            }
            return;
        }

        setIsTyping(typing);
        onStatusChange(typing);

        if (typing) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setIsTyping(false);
                onStatusChange(false);
            }, 3000);
        }
    }, [isTyping, onStatusChange]);

    return { isTyping, setTyping };
};
