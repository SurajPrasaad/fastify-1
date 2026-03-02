"use client";

import React, { useState } from "react";
import {
    CheckCircle2,
    XCircle,
    RotateCcw,
    Clock,
    Flag,
    ArrowUpRight,
    Image,
    Code,
    User,
} from "lucide-react";

// ==========================================
// TYPES & DATA
// ==========================================

export interface QueuePost {
    id: string;
    content: string;
    codeSnippet?: string;
    mediaUrls: string[];
    riskScore: number;
    createdAt: string;
    author: { username: string; name: string; avatarUrl?: string };
    reportsCount: number;
    status: string;
}

export const MOCK_QUEUE: QueuePost[] = [
    { id: "1", content: "Just discovered an amazing approach to building GraphQL APIs with TypeScript. The type safety is incredible when you use code-first schema generation combined with...", codeSnippet: "const schema = buildSchema({...})", mediaUrls: [], riskScore: 85, createdAt: new Date(Date.now() - 120000).toISOString(), author: { username: "devJohn", name: "John Dev", avatarUrl: undefined }, reportsCount: 3, status: "PENDING_REVIEW" },
    { id: "2", content: "🔥 EARN $5000 A DAY FROM HOME! Click here to learn how → bit.ly/scam123 No experience needed!", mediaUrls: [], riskScore: 92, createdAt: new Date(Date.now() - 300000).toISOString(), author: { username: "easyMoney42", name: "Easy Money", avatarUrl: undefined }, reportsCount: 7, status: "PENDING_REVIEW" },
    { id: "3", content: "Here's my take on the new React Server Components pattern. I think it fundamentally changes how we think about component architecture...", mediaUrls: ["https://example.com/img1.jpg"], riskScore: 12, createdAt: new Date(Date.now() - 600000).toISOString(), author: { username: "reactDev", name: "React Developer", avatarUrl: undefined }, reportsCount: 0, status: "PENDING_REVIEW" },
    { id: "4", content: "Step-by-step tutorial: How to bypass authentication in popular web frameworks. First, you need to...", codeSnippet: "const exploit = () => {...}", mediaUrls: [], riskScore: 78, createdAt: new Date(Date.now() - 900000).toISOString(), author: { username: "securityNoob", name: "Hacker Wannabe", avatarUrl: undefined }, reportsCount: 2, status: "PENDING_REVIEW" },
    { id: "5", content: "Just shipped a major update to our open-source CSS framework. New features include container queries, subgrid support, and a much improved dark mode system.", mediaUrls: [], riskScore: 5, createdAt: new Date(Date.now() - 1200000).toISOString(), author: { username: "cssWizard", name: "CSS Wizard", avatarUrl: undefined }, reportsCount: 0, status: "PENDING_REVIEW" },
];

// ==========================================
// COMPONENTS
// ==========================================

const RiskBadge = ({ score }: { score: number }) => {
    let style;
    if (score >= 80) {
        style = {
            bg: "bg-[#F91880]/10",
            text: "text-[#F91880]",
            border: "border-[#F91880]/20",
            label: "CRITICAL",
        };
    } else if (score >= 60) {
        style = {
            bg: "bg-[#FFD400]/10",
            text: "text-[#FFD400]",
            border: "border-[#FFD400]/20",
            label: "HIGH",
        };
    } else if (score >= 40) {
        style = {
            bg: "bg-[#1D9BF0]/10",
            text: "text-[#1D9BF0]",
            border: "border-[#1D9BF0]/20",
            label: "MEDIUM",
        };
    } else {
        style = {
            bg: "bg-[#71767B]/10",
            text: "text-[#71767B]",
            border: "border-[#71767B]/20",
            label: "LOW",
        };
    }

    return (
        <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.bg} ${style.text} border ${style.border}`}
        >
            {style.label} · {score}
        </span>
    );
};

function timeAgo(createdAt: string): string {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

// ==========================================
type QueueVariant =
    | "ALL"
    | "HIGH_RISK"
    | "LOW_RISK"
    | "AUTO_FLAGGED"
    | "USER_REPORTED"
    | "ESCALATED";

// MAIN QUEUE COMPONENT
// ==========================================

function QueueView({ variant }: { readonly variant: QueueVariant }) {
    const [selectedPost, setSelectedPost] = useState<string | null>(null);
    const [actionReason, setActionReason] = useState("");
    const [showActionModal, setShowActionModal] = useState<{ postId: string; action: string } | null>(null);

    const meta: Record<QueueVariant, { title: string; subtitle: string }> = {
        ALL: {
            title: "Moderation Queue",
            subtitle: "All pending content, sorted by risk score",
        },
        HIGH_RISK: {
            title: "High Risk Queue",
            subtitle: "Items with elevated AI risk scores and multiple reports",
        },
        LOW_RISK: {
            title: "Low Risk Queue",
            subtitle: "Benign or informational content with minimal signals",
        },
        AUTO_FLAGGED: {
            title: "Auto-Flagged Content",
            subtitle: "Content automatically flagged by AI or safety rules",
        },
        USER_REPORTED: {
            title: "User Reported",
            subtitle: "Content reported directly by community members",
        },
        ESCALATED: {
            title: "Escalated Cases",
            subtitle: "High-impact decisions escalated for senior review",
        },
    };

    const items = (() => {
        switch (variant) {
            case "HIGH_RISK":
                return MOCK_QUEUE.filter((p) => p.riskScore >= 60);
            case "LOW_RISK":
                return MOCK_QUEUE.filter((p) => p.riskScore < 40);
            case "AUTO_FLAGGED":
                return MOCK_QUEUE.filter((p) => p.riskScore >= 70);
            case "USER_REPORTED":
                return MOCK_QUEUE.filter((p) => p.reportsCount > 0);
            case "ESCALATED":
                return MOCK_QUEUE.filter((p) => p.riskScore >= 80 && p.reportsCount >= 2);
            case "ALL":
            default:
                return MOCK_QUEUE;
        }
    })();

    const handleAction = (postId: string, action: string) => {
        if (action === "APPROVE") {
            // Quick approve doesn't need a reason
            alert(`✅ Post ${postId} approved`);
            return;
        }
        setShowActionModal({ postId, action });
    };

    const confirmAction = () => {
        if (!showActionModal) return;
        alert(`Action: ${showActionModal.action} on post ${showActionModal.postId}\nReason: ${actionReason}`);
        setShowActionModal(null);
        setActionReason("");
    };

    return (
        <div className="flex-1 flex flex-col bg-black text-[#E7E9EA] h-screen font-display overflow-hidden">
            {/* HEADER */}
            <div className="px-6 py-4 border-b border-[#2F3336] bg-black/90 backdrop-blur-md shrink-0 sticky top-0 z-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[20px] font-bold tracking-[-0.02em]">{meta[variant].title}</h1>
                        <p className="text-[13px] text-[#71767B] mt-0.5">
                            <span className="text-[#FFD400] font-bold">{items.length}</span>{" "}
                            posts · {meta[variant].subtitle}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#16181C] border border-[#2F3336] rounded-lg text-[12px] text-[#71767B]">
                            <Clock className="w-3.5 h-3.5" /> Avg: 2m 14s
                        </div>
                    </div>
                </div>
            </div>

            {/* QUEUE LIST */}
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-[#2F3336]">
                    {items.map((post) => (
                        <button
                            key={post.id}
                            type="button"
                            className={`w-full text-left px-6 py-5 hover:bg-[#16181C]/50 transition-colors ${
                                selectedPost === post.id
                                    ? "bg-[#16181C]/80 border-l-2 border-[#1D9BF0]"
                                    : ""
                            }`}
                            onClick={() =>
                                setSelectedPost(post.id === selectedPost ? null : post.id)
                            }
                        >
                            {/* Post Header */}
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#2F3336] flex items-center justify-center text-[#71767B] shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-[14px]">{post.author.name}</span>
                                        <span className="text-[#71767B] text-[13px]">@{post.author.username}</span>
                                        <span className="text-[#71767B] text-[12px]">· {timeAgo(post.createdAt)}</span>
                                        <RiskBadge score={post.riskScore} />
                                        {post.reportsCount > 0 && (
                                            <span className="flex items-center gap-1 text-[11px] text-[#F91880] font-bold">
                                                <Flag className="w-3 h-3" /> {post.reportsCount} reports
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <p className="text-[14px] text-[#E7E9EA] mt-2 leading-relaxed">{post.content}</p>

                                    {post.codeSnippet && (
                                        <div className="mt-2 bg-[#0D1117] border border-[#2F3336] rounded-lg p-3 font-mono text-[12px] text-[#8B949E]">
                                            <Code className="w-3.5 h-3.5 inline mr-2 text-[#71767B]" />
                                            {post.codeSnippet}
                                        </div>
                                    )}

                                    {post.mediaUrls.length > 0 && (
                                        <div className="mt-2 flex items-center gap-1 text-[12px] text-[#71767B]">
                                            <Image className="w-3.5 h-3.5" /> {post.mediaUrls.length} media attachment(s)
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 mt-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAction(post.id, "APPROVE"); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00BA7C]/10 text-[#00BA7C] border border-[#00BA7C]/20 rounded-lg text-[12px] font-bold hover:bg-[#00BA7C]/20 transition-colors"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAction(post.id, "REJECT"); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F91880]/10 text-[#F91880] border border-[#F91880]/20 rounded-lg text-[12px] font-bold hover:bg-[#F91880]/20 transition-colors"
                                        >
                                            <XCircle className="w-3.5 h-3.5" /> Reject
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAction(post.id, "REQUEST_REVISION"); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD400]/10 text-[#FFD400] border border-[#FFD400]/20 rounded-lg text-[12px] font-bold hover:bg-[#FFD400]/20 transition-colors"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" /> Revise
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAction(post.id, "ESCALATE"); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8247E5]/10 text-[#8247E5] border border-[#8247E5]/20 rounded-lg text-[12px] font-bold hover:bg-[#8247E5]/20 transition-colors"
                                        >
                                            <ArrowUpRight className="w-3.5 h-3.5" /> Escalate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ACTION MODAL */}
            {showActionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowActionModal(null)}
                    />
                    <div className="relative bg-[#16181C] border border-[#2F3336] rounded-2xl w-full max-w-[480px] p-6 shadow-2xl">
                        <h3 className="text-[18px] font-bold mb-1">
                            {(() => {
                                if (showActionModal.action === "REJECT") return "Reject Post";
                                if (showActionModal.action === "REQUEST_REVISION") return "Request Revision";
                                return "Escalate Post";
                            })()}
                        </h3>
                        <p className="text-[13px] text-[#71767B] mb-4">Provide a reason for this action. This will be visible to the author.</p>
                        <textarea
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            placeholder="Enter reason..."
                            className="w-full bg-black border border-[#2F3336] rounded-xl p-3 text-[14px] text-[#E7E9EA] placeholder:text-[#71767B] focus:border-[#1D9BF0] focus:outline-none resize-none h-[120px]"
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setShowActionModal(null)}
                                className="px-4 py-2 text-[13px] font-bold text-[#E7E9EA] bg-[#2F3336] rounded-full hover:bg-[#333639] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                disabled={!actionReason.trim()}
                                className="px-4 py-2 text-[13px] font-bold text-white bg-[#1D9BF0] rounded-full hover:bg-[#1A8CD8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirm {showActionModal.action.replace("_", " ").toLowerCase()}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ModeratorQueue() {
    return <QueueView variant="ALL" />;
}

export function ModeratorQueueHighRisk() {
    return <QueueView variant="HIGH_RISK" />;
}

export function ModeratorQueueLowRisk() {
    return <QueueView variant="LOW_RISK" />;
}

export function ModeratorQueueAutoFlagged() {
    return <QueueView variant="AUTO_FLAGGED" />;
}

export function ModeratorQueueUserReported() {
    return <QueueView variant="USER_REPORTED" />;
}

export function ModeratorQueueEscalated() {
    return <QueueView variant="ESCALATED" />;
}
