
import React from 'react';
import {
    Reply,
    Copy,
    Trash2,
    Forward,
    Edit3,
    Smile
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MessageActionsMenuProps {
    onReply: () => void;
    onCopy: () => void;
    onForward: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onReact: (emoji: string) => void;
}

export const MessageActionsMenu: React.FC<MessageActionsMenuProps> = ({
    onReply,
    onCopy,
    onForward,
    onEdit,
    onDelete,
    onReact
}) => {
    const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-popover text-popover-foreground border shadow-xl rounded-2xl p-2 min-w-[220px] z-50 overflow-hidden"
        >
            {/* Reactions Row */}
            <div className="flex justify-between px-2 py-2 border-b mb-1">
                {commonEmojis.map(emoji => (
                    <button
                        key={emoji}
                        onClick={() => onReact(emoji)}
                        className="text-xl hover:scale-125 transition-transform p-1"
                    >
                        {emoji}
                    </button>
                ))}
                <button className="p-1 hover:bg-muted rounded-full">
                    <Smile className="w-5 h-5 opacity-60" />
                </button>
            </div>

            <div className="flex flex-col gap-0.5">
                <ActionButton icon={<Reply className="w-4 h-4" />} label="Reply" onClick={onReply} />
                <ActionButton icon={<Copy className="w-4 h-4" />} label="Copy Text" onClick={onCopy} />
                <ActionButton icon={<Edit3 className="w-4 h-4" />} label="Edit" onClick={onEdit} />
                <ActionButton icon={<Forward className="w-4 h-4" />} label="Forward" onClick={onForward} />
                <div className="h-px bg-muted my-1" />
                <ActionButton
                    icon={<Trash2 className="w-4 h-4" />}
                    label="Delete"
                    onClick={onDelete}
                    variant="destructive"
                />
            </div>
        </motion.div>
    );
};

const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    variant?: 'default' | 'destructive';
}> = ({ icon, label, onClick, variant = 'default' }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors",
            variant === 'destructive'
                ? "text-destructive hover:bg-destructive/10"
                : "hover:bg-muted"
        )}
    >
        <span className="opacity-70">{icon}</span>
        {label}
    </button>
);
