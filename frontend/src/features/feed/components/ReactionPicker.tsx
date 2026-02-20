import { motion } from "framer-motion";
import { ReactionType } from "@/features/shared/types";

interface ReactionPickerProps {
    onSelect: (type: ReactionType) => void;
}

const reactions = [
    { type: ReactionType.HEART, emoji: "❤️" },
    { type: ReactionType.LAUGH, emoji: "😂" },
    { type: ReactionType.WOW, emoji: "😮" },
    { type: ReactionType.SAD, emoji: "😢" },
    { type: ReactionType.ANGRY, emoji: "😡" },
];

export const ReactionPicker = ({ onSelect }: ReactionPickerProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full shadow-xl"
        >
            {reactions.map((reaction) => (
                <button
                    key={reaction.type}
                    onClick={() => onSelect(reaction.type)}
                    className="text-2xl hover:scale-125 transition-transform duration-200"
                >
                    {reaction.emoji}
                </button>
            ))}
        </motion.div>
    );
};
