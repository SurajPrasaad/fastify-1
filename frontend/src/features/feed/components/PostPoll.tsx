import { useState } from 'react';
import { IPoll, IPollOption } from '@/features/shared/types';
import { postService } from '@/services/post.service';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface PostPollProps {
    poll: IPoll;
    postId: string;
}

export const PostPoll = ({ poll, postId }: PostPollProps) => {
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(poll.userVotedOptionId || null);
    const [localPoll, setLocalPoll] = useState<IPoll>(poll);
    const [isVoting, setIsVoting] = useState(false);

    const totalVotes = localPoll.options.reduce((acc, opt) => acc + opt.votesCount, 0);
    const hasVoted = !!selectedOptionId;
    const isExpired = new Date(localPoll.expiresAt) < new Date();

    const handleVote = async (optionId: string) => {
        if (hasVoted || isExpired || isVoting) return;

        setIsVoting(true);
        try {
            await postService.votePoll(postId, optionId);
            setSelectedOptionId(optionId);

            // Optimistically update local state
            setLocalPoll(prev => ({
                ...prev,
                userVotedOptionId: optionId,
                options: prev.options.map(opt =>
                    opt.id === optionId
                        ? { ...opt, votesCount: opt.votesCount + 1 }
                        : opt
                )
            }));

            toast.success('Vote recorded!');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to vote');
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
            {localPoll.options.map((option) => {
                const percentage = totalVotes > 0
                    ? Math.round((option.votesCount / totalVotes) * 100)
                    : 0;
                const isSelected = selectedOptionId === option.id;

                return (
                    <button
                        key={option.id}
                        disabled={hasVoted || isExpired || isVoting}
                        onClick={() => handleVote(option.id)}
                        className={cn(
                            "relative w-full text-left p-3 rounded-xl border transition-all overflow-hidden group",
                            hasVoted
                                ? "border-transparent bg-gray-100/50 dark:bg-gray-800/50 cursor-default"
                                : "border-gray-200 dark:border-gray-800 hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                            isSelected && "ring-1 ring-primary"
                        )}
                    >
                        {/* Progress Bar Background */}
                        {hasVoted && (
                            <div
                                className={cn(
                                    "absolute inset-y-0 left-0 transition-all duration-500",
                                    isSelected ? "bg-primary/20" : "bg-gray-200/50 dark:bg-gray-700/50"
                                )}
                                style={{ width: `${percentage}%` }}
                            />
                        )}

                        <div className="relative flex justify-between items-center z-10">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "font-medium",
                                    isSelected ? "text-primary font-bold" : "text-gray-700 dark:text-gray-300"
                                )}>
                                    {option.text}
                                </span>
                                {isSelected && <CheckCircle2 size={16} className="text-primary" />}
                            </div>
                            {hasVoted && (
                                <span className="text-sm font-bold text-gray-500">
                                    {percentage}%
                                </span>
                            )}
                        </div>
                    </button>
                );
            })}

            <div className="flex justify-between items-center text-xs text-gray-500 px-1 pt-1 font-medium">
                <span>{totalVotes.toLocaleString()} votes</span>
                <span>
                    {isExpired
                        ? "Final results"
                        : `Ends ${new Date(localPoll.expiresAt).toLocaleDateString()}`
                    }
                </span>
            </div>
        </div>
    );
};
