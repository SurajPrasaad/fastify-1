"use client";

import React, { useEffect, useState } from "react";
import { callApi, CallLog } from "@/features/call/api/callApi";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Trash2, MoreVertical, Search } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCall } from "@/features/call/context/CallContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CallHistoryPage() {
    const { user } = useAuth();
    const { initiateCall } = useCall();
    const [history, setHistory] = useState<CallLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "missed">("all");

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await callApi.getHistory();
            setHistory(data);
        } catch (err) {
            console.error("Failed to load history", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await callApi.deleteLog(id);
            setHistory(history.filter(log => log.id !== id));
        } catch (err) {
            console.error("Failed to delete log", err);
        }
    };

    const filteredHistory = history.filter(log => {
        if (filter === 'missed') return log.status === 'MISSED';
        return true;
    });

    return (
        <div className="flex flex-col h-screen bg-background">
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Calls</h1>
                        <p className="text-sm text-muted-foreground">Recent call activity</p>
                    </div>
                </div>

                <div className="px-6 pb-2 flex items-center gap-4">
                    <button
                        onClick={() => setFilter("all")}
                        className={cn(
                            "pb-2 text-sm font-medium transition-colors border-b-2",
                            filter === "all" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter("missed")}
                        className={cn(
                            "pb-2 text-sm font-medium transition-colors border-b-2",
                            filter === "missed" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Missed
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-8 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <div className="size-20 bg-muted rounded-full flex items-center justify-center">
                            <Phone className="size-10 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-xl font-bold">No calls found</h3>
                        <p className="text-muted-foreground">Your recent calls will appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredHistory.map((log) => {
                            const isIncoming = log.receiverId === user?.id;
                            const remoteUser = isIncoming ? log.caller : log.receiver;
                            const isMissed = log.status === "MISSED";

                            return (
                                <div key={log.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="size-12 border">
                                            <AvatarImage src={remoteUser.avatarUrl} />
                                            <AvatarFallback>{remoteUser.name[0]}</AvatarFallback>
                                        </Avatar>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold">{remoteUser.name}</h4>
                                                {isIncoming ? (
                                                    isMissed ? <PhoneMissed className="size-3 text-destructive" /> : <PhoneIncoming className="size-3 text-green-500" />
                                                ) : (
                                                    <PhoneOutgoing className="size-3 text-blue-500" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{log.callType} call</span>
                                                <span>•</span>
                                                <span>{formatDistanceToNow(new Date(log.startedAt), { addSuffix: true })}</span>
                                                {log.status === "COMPLETED" && log.durationSeconds > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{Math.floor(log.durationSeconds / 60)}m {log.durationSeconds % 60}s</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                                            onClick={() => initiateCall(remoteUser.id, remoteUser.name, remoteUser.avatarUrl, log.callType)}
                                        >
                                            {log.callType === "VIDEO" ? <Video className="size-5" /> : <Phone className="size-5" />}
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-full">
                                                    <MoreVertical className="size-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleDelete(log.id)} className="text-destructive">
                                                    <Trash2 className="size-4 mr-2" />
                                                    Delete log
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
