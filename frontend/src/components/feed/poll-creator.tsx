"use client"

import * as React from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PollData {
    question: string;
    options: string[];
    expiresAt: Date;
}

interface PollCreatorProps {
    data: PollData;
    onUpdate: (poll: PollData | null) => void;
}

export function PollCreator({ data, onUpdate }: PollCreatorProps) {
    const [duration, setDuration] = React.useState("24") // hours

    const handleQuestionChange = (value: string) => {
        onUpdate({ ...data, question: value });
    }

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...data.options]
        newOptions[index] = value
        onUpdate({ ...data, options: newOptions });
    }

    const handleAddOption = () => {
        if (data.options.length < 4) {
            onUpdate({ ...data, options: [...data.options, ""] });
        }
    }

    const handleRemoveOption = (index: number) => {
        if (data.options.length > 2) {
            const newOptions = data.options.filter((_, i) => i !== index)
            onUpdate({ ...data, options: newOptions });
        }
    }

    const handleDurationChange = (hrs: string) => {
        setDuration(hrs);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + parseInt(hrs));
        onUpdate({ ...data, expiresAt });
    }

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-2">
                <Input
                    placeholder="Ask a question..."
                    value={data.question}
                    onChange={(e) => handleQuestionChange(e.target.value)}
                    className="bg-transparent border-slate-700 focus:border-primary transition-all font-bold text-white"
                />
            </div>
            
            <div className="flex flex-col gap-2">
                {data.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            placeholder={`Choice ${index + 1}`}
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            className="bg-transparent border-slate-700 focus:border-primary transition-all flex-1 min-w-0 text-white"
                        />
                        {data.options.length > 2 && (
                            <button
                                onClick={() => handleRemoveOption(index)}
                                className="text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                ))}
                {data.options.length < 4 && (
                    <button
                        onClick={handleAddOption}
                        className="text-primary text-sm font-medium flex items-center gap-1 hover:underline w-fit mt-1"
                    >
                        <Plus size={16} /> Add a choice
                    </button>
                )}
            </div>

            <div className="border-t border-slate-800 pt-3 mt-1">
                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Poll length</label>
                <div className="flex gap-4 mt-2">
                    <div className="flex-1 min-w-0">
                        <select
                            value={duration}
                            onChange={(e) => handleDurationChange(e.target.value)}
                            className="w-full bg-transparent border border-slate-800 rounded-lg p-2 text-sm outline-none focus:border-primary text-white"
                        >
                            <option value="1" className="bg-slate-900">1 Hour</option>
                            <option value="6" className="bg-slate-900">6 Hours</option>
                            <option value="12" className="bg-slate-900">12 Hours</option>
                            <option value="24" className="bg-slate-900">1 Day</option>
                            <option value="72" className="bg-slate-900">3 Days</option>
                            <option value="168" className="bg-slate-900">7 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 self-center"
                onClick={() => onUpdate(null)}
            >
                Remove poll
            </Button>
        </div>
    )
}
