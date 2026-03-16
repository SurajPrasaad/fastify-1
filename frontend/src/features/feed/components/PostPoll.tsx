import React, { useState, useEffect } from 'react';
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

    // Sync state when props change, but don't overwrite if we're currently voting
    useEffect(() => {
        if (!isVoting) {
            setSelectedOptionId(poll.userVotedOptionId || null);
            setLocalPoll(poll);
        }
    }, [poll, isVoting]);

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
                            "relative w-full text-left p-3.5 rounded-xl border transition-all duration-300 overflow-hidden group",
                            hasVoted
                                ? "border-slate-800 bg-slate-900/40 cursor-default"
                                : "border-slate-800 hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                            isSelected && "border-primary/50"
                        )}
                    >
                        {/* Progress Bar Background */}
                        {hasVoted && (
                            <div
                                className={cn(
                                    "absolute inset-y-0 left-0 transition-all duration-700 ease-out",
                                    isSelected 
                                        ? "bg-primary/30 dark:bg-primary/40" 
                                        : "bg-slate-200/50 dark:bg-slate-800/50"
                                )}
                                style={{ width: `${percentage}%` }}
                            />
                        )}

                        <div className="relative flex justify-between items-center z-10">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "font-semibold text-sm transition-colors",
                                    isSelected ? "text-primary" : "text-slate-700 dark:text-slate-300"
                                )}>
                                    {option.text}
                                </span>
                                {isSelected && <CheckCircle2 size={16} className="text-primary animate-in zoom-in-50 duration-300" />}
                            </div>
                            {hasVoted && (
                                <span className={cn(
                                    "text-xs font-bold transition-colors",
                                    isSelected ? "text-primary" : "text-slate-500"
                                )}>
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
