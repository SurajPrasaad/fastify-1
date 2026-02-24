"use client"

import * as React from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PollCreatorProps {
    onUpdate: (poll: { question: string; options: string[]; expiresAt: Date } | null) => void
}

export function PollCreator({ onUpdate }: PollCreatorProps) {
    const [options, setOptions] = React.useState(["", ""])
    const [duration, setDuration] = React.useState("24") // hours

    const handleAddOption = () => {
        if (options.length < 4) {
            setOptions([...options, ""])
        }
    }

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index)
            setOptions(newOptions)
        }
    }

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options]
        newOptions[index] = value
        setOptions(newOptions)
    }

    React.useEffect(() => {
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + parseInt(duration))

        onUpdate({
            question: "", // Post content will be the question
            options: options.filter(opt => opt.trim() !== ""),
            expiresAt
        })
    }, [options, duration])

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-2">
                {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            placeholder={`Choice ${index + 1}`}
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            className="bg-transparent border-slate-700 focus:border-primary transition-all"
                        />
                        {options.length > 2 && (
                            <button
                                onClick={() => handleRemoveOption(index)}
                                className="text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                ))}
                {options.length < 4 && (
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
                    <div className="flex-1">
                        <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full bg-transparent border border-slate-800 rounded-lg p-2 text-sm outline-none focus:border-primary"
                        >
                            <option value="1">1 Hour</option>
                            <option value="6">6 Hours</option>
                            <option value="12">12 Hours</option>
                            <option value="24">1 Day</option>
                            <option value="72">3 Days</option>
                            <option value="168">7 Days</option>
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
