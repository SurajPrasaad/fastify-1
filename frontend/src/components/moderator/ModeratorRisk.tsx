"use client";

import React from "react";
import { Activity, ShieldAlert, Repeat } from "lucide-react";

type RiskVariant = "AI_SCORES" | "SENSITIVE" | "REPEAT";

const VARIANT_META: Record<
    RiskVariant,
    { title: string; subtitle: string; icon: React.ElementType; accent: string }
> = {
    AI_SCORES: {
        title: "AI Risk Scores",
        subtitle: "Distribution of AI-generated content risk assessments",
        icon: Activity,
        accent: "text-[#22C55E]",
    },
    SENSITIVE: {
        title: "Sensitive Content",
        subtitle: "Content touching on violence, self-harm, or other sensitive topics",
        icon: ShieldAlert,
        accent: "text-[#F97316]",
    },
    REPEAT: {
        title: "Repeat Offenders",
        subtitle: "Accounts with repeated policy violations or frequent reports",
        icon: Repeat,
        accent: "text-[#F43F5E]",
    },
};

function RiskView({ variant }: { readonly variant: RiskVariant }) {
    const meta = VARIANT_META[variant];
    const Icon = meta.icon;

    return (
        <div className="flex-1 flex flex-col bg-black text-[#E7E9EA] h-screen font-display overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2F3336] bg-black/90 backdrop-blur-md shrink-0 sticky top-0 z-20 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${meta.accent}`} />
                        <h1 className="text-[20px] font-bold tracking-[-0.02em]">{meta.title}</h1>
                    </div>
                    <p className="text-[13px] text-[#71767B] mt-0.5">{meta.subtitle}</p>
                </div>
                <span className="text-[12px] text-[#71767B]">Mock analytics — UI only</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
                        <p className="text-[12px] text-[#9CA3AF] mb-1">High Risk Items (24h)</p>
                        <p className="text-[24px] font-bold text-[#F97316]">128</p>
                    </div>
                    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
                        <p className="text-[12px] text-[#9CA3AF] mb-1">Auto-Blocked</p>
                        <p className="text-[24px] font-bold text-[#F43F5E]">37</p>
                    </div>
                    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
                        <p className="text-[12px] text-[#9CA3AF] mb-1">Human-reviewed</p>
                        <p className="text-[24px] font-bold text-[#22C55E]">91</p>
                    </div>
                </div>

                <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 space-y-4">
                    <h2 className="text-[16px] font-bold">
                        Key {variant === "REPEAT" ? "Account Cohorts" : "Risk Buckets"}
                    </h2>
                    <div className="space-y-3 text-[13px] text-[#D1D5DB]">
                        <p>
                            This section is a visual placeholder showing how detailed analytics for{" "}
                            <span className="font-semibold">{meta.title.toLowerCase()}</span> will
                            appear once backend metrics are wired.
                        </p>
                        <p className="text-[#9CA3AF]">
                            You can plug real chart components (e.g. ECharts, Recharts) here using
                            the same layout and container styling.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ModeratorRiskAiScores() {
    return <RiskView variant="AI_SCORES" />;
}

export function ModeratorRiskSensitiveContent() {
    return <RiskView variant="SENSITIVE" />;
}

export function ModeratorRiskRepeatOffenders() {
    return <RiskView variant="REPEAT" />;
}

