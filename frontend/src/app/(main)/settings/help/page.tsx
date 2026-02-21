"use client";

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
    Loader2,
    PlusCircle,
    Search,
    Sparkles,
    UserCircle,
    Shield,
    CreditCard,
    Ticket,
    MoreHorizontal,
    Headset,
    X,
    Upload,
    ChevronDown,
    Send
} from "lucide-react";
import { useState } from "react";

const SUPPORT_TICKETS = [
    {
        id: "#4432",
        subject: "Cannot change profile picture",
        category: "Technical Support",
        status: "Open",
        statusColor: "text-primary bg-primary/10",
        lastUpdate: "Oct 24, 2023"
    },
    {
        id: "#4391",
        subject: "Privacy settings inquiry",
        category: "Account & Privacy",
        status: "Resolved",
        statusColor: "text-emerald-500 bg-emerald-500/10",
        lastUpdate: "Oct 12, 2023"
    },
    {
        id: "#4105",
        subject: "Reporting suspicious login",
        category: "Security",
        status: "Resolved",
        statusColor: "text-emerald-500 bg-emerald-500/10",
        lastUpdate: "Sep 28, 2023"
    }
];

const POPULAR_TOPICS = [
    {
        title: "Account Access",
        desc: "Trouble logging in, password recovery, and account management.",
        icon: UserCircle,
        color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30"
    },
    {
        title: "Privacy & Safety",
        desc: "Manage who sees your content and report community violations.",
        icon: Shield,
        color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30"
    },
    {
        title: "Billing & Payment",
        desc: "Manage subscriptions, billing history, and payment methods.",
        icon: CreditCard,
        color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30"
    }
];

export default function SettingsHelpPage() {
    const { user, isLoading } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="relative">
            <div className={cn(
                "animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-5xl mx-auto",
                isTicketModalOpen && "blur-sm pointer-events-none transition-all duration-300"
            )}>
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Help & Support</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Find answers or contact our support team 24/7.</p>
                    </div>
                    <button
                        onClick={() => setIsTicketModalOpen(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <PlusCircle className="size-5" />
                        Create New Ticket
                    </button>
                </header>

                {/* Search Support */}
                <section className="mb-16">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
                            <Search className="size-6 text-slate-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-16 pr-8 py-6 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-primary focus:ring-0 rounded-3xl shadow-xl dark:shadow-none placeholder-slate-400 dark:placeholder-slate-600 text-xl font-bold transition-all"
                            placeholder="How can we help you today?"
                        />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold">
                        <span className="text-slate-400">Popular searches:</span>
                        <button className="text-primary hover:underline">Reset password</button>
                        <button className="text-primary hover:underline">Verification badge</button>
                        <button className="text-primary hover:underline">Privacy settings</button>
                    </div>
                </section>

                {/* Popular Topics */}
                <section className="mb-16">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                        <Sparkles className="size-6 text-primary" />
                        Popular Topics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {POPULAR_TOPICS.map((topic) => (
                            <div
                                key={topic.title}
                                className="bg-white dark:bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/30 transition-all cursor-pointer group shadow-sm hover:shadow-xl hover:shadow-primary/5"
                            >
                                <div className={cn("size-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300", topic.color)}>
                                    <topic.icon className="size-7" />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{topic.title}</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed font-medium">
                                    {topic.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Support Tickets */}
                <section className="mb-16">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <Ticket className="size-6 text-primary" />
                            Support Tickets
                        </h3>
                        <button className="text-sm font-black uppercase tracking-widest text-primary hover:underline">View all history</button>
                    </div>
                    <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800/50">
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Ticket ID</th>
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Subject</th>
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 text-center">Status</th>
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Last Update</th>
                                        <th className="px-8 py-5"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {SUPPORT_TICKETS.map((ticket) => (
                                        <tr key={ticket.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                            <td className="px-8 py-6 font-bold text-slate-400 dark:text-slate-500 text-sm">{ticket.id}</td>
                                            <td className="px-8 py-6">
                                                <p className="font-bold text-slate-900 dark:text-white text-[15px] group-hover:text-primary transition-colors">{ticket.subject}</p>
                                                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mt-1">{ticket.category}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    <span className={cn("px-4 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-full", ticket.statusColor)}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-bold text-slate-500 dark:text-slate-400">{ticket.lastUpdate}</td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="text-slate-300 hover:text-primary transition-colors">
                                                    <MoreHorizontal className="size-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Contact CTA */}
                <div className="p-12 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-[3rem] flex flex-col items-center text-center shadow-xl shadow-primary/5">
                    <div className="size-20 bg-primary/20 rounded-3xl flex items-center justify-center mb-8 animate-pulse shadow-inner shadow-primary/20">
                        <Headset className="size-10 text-primary" />
                    </div>
                    <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Still need help?</h4>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 text-lg font-medium leading-relaxed">
                        If you couldn't find what you're looking for, our expert team is ready to assist you personally.
                    </p>
                    <button className="bg-primary text-white px-10 py-5 rounded-2xl font-black transition-all shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 text-lg">
                        Chat with Support Now
                    </button>
                </div>

                {/* <footer className="mt-20 py-12 border-t border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        © 2024 SocialMedia Inc. • <button className="hover:text-primary">Terms</button> • <button className="hover:text-primary">Privacy Policy</button>
                    </p>
                </footer> */}
            </div>

            {/* Create New Ticket Modal */}
            {isTicketModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#161B22] w-full max-w-2xl rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Create New Ticket</h2>
                                <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Our team typically responds within 4 hours.</p>
                            </div>
                            <button
                                onClick={() => setIsTicketModalOpen(false)}
                                className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            >
                                <X className="size-6" />
                            </button>
                        </div>

                        {/* Modal Content (Form) */}
                        <div className="px-10 py-8 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar">
                            <form className="space-y-8">
                                {/* Subject Field */}
                                <div className="space-y-3">
                                    <label className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Subject</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold text-slate-900 dark:text-white"
                                        placeholder="Briefly describe your issue"
                                        type="text"
                                    />
                                </div>

                                {/* Category Field */}
                                <div className="space-y-3">
                                    <label className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Category</label>
                                    <div className="relative group">
                                        <select className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
                                            <option disabled selected value="">Select a category</option>
                                            <option>Account Access</option>
                                            <option>Privacy & Safety</option>
                                            <option>Billing & Payment</option>
                                            <option>Technical Issue</option>
                                            <option>Other</option>
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors" />
                                    </div>
                                </div>

                                {/* Description Field */}
                                <div className="space-y-3">
                                    <label className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Description</label>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none font-medium text-slate-900 dark:text-white"
                                        placeholder="Provide more details about your request..."
                                        rows={4}
                                    ></textarea>
                                </div>

                                {/* Attachments / Upload */}
                                <div className="space-y-3">
                                    <label className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Attachments</label>
                                    <div className="border-3 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-12 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all cursor-pointer group hover:border-primary/50">
                                        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform shadow-inner shadow-primary/10">
                                            <Upload className="size-8" />
                                        </div>
                                        <p className="text-lg font-black text-slate-800 dark:text-slate-200">Drag and drop or click to upload</p>
                                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">PNG, JPG or PDF (Max. 5MB per file)</p>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-5">
                            <button
                                onClick={() => setIsTicketModalOpen(false)}
                                className="px-8 py-4 rounded-2xl font-black text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button className="px-10 py-4 rounded-2xl font-black bg-primary text-white hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all active:scale-95 flex items-center gap-2 hover:-translate-y-0.5">
                                Submit Ticket
                                <Send className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
