"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function RightSidebar({ className }: { className?: string }) {
    return (
        <aside className={cn("hidden lg:flex flex-col w-80 h-screen p-6 gap-6 overflow-y-auto", className)}>
            {/* Search */}
            <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                    search
                </span>
                <input
                    className="w-full bg-slate-100 dark:bg-surface-dark border-none rounded-full py-3 pl-12 pr-4 focus:ring-1 focus:ring-primary focus:bg-transparent transition-all outline-none text-sm"
                    placeholder="Search SocialApp"
                    type="text"
                />
            </div>

            {/* Trending Section */}
            <div className="bg-slate-100 dark:bg-surface-dark rounded-2xl overflow-hidden">
                <h3 className="text-lg font-bold p-4 pb-2">Trending</h3>
                <div className="flex flex-col">
                    <TrendingItem category="Technology · Trending" topic="#NextJS15" posts="42.5k posts" />
                    <TrendingItem category="UI/UX · Trending" topic="#DesignSystems" posts="18.2k posts" />
                    <TrendingItem category="Gaming · Trending" topic="#PS6Leaks" posts="89k posts" />
                    <button className="w-full text-left px-4 py-4 text-primary text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
                        Show more
                    </button>
                </div>
            </div>

            {/* Who to Follow */}
            <div className="bg-slate-100 dark:bg-surface-dark rounded-2xl overflow-hidden">
                <h3 className="text-lg font-bold p-4 pb-2">Who to follow</h3>
                <div className="flex flex-col">
                    <FollowSuggestion
                        name="Elena Rossi"
                        username="@elena_ui"
                        avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuANQibdnorVH9NDnwT6Ft2U-crm10DIqquXtgXNOhPBlvipTzyC28f2ZZjRVbWOCroK1D9Bas8-7h8jwuNh8u_skRE78LH2pdb8wdHV_rGi4YVXwJwQH9dQlSiIazXvZtdFfErJz2P_mzACGmmCW94Vubj6F6TMN5rLqna018HGVCIJdXFGBu_5MuiVE_yKGTH-1vWdUHlgBYr0uT6Q7dfRjnd-gtoz6aum2NDmqjRmxtcxAzZaOMj4cMJswCSL3yc_XqzMdYfdXFw"
                    />
                    <FollowSuggestion
                        name="Mark Thorne"
                        username="@mthorne"
                        avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuBxLt_607h_VQ1fRLZa5pIs5BgcSxGCfc3E5p0oD7wSiNvZlrpUKrCKWLhasDGf0h1uzJNpinquGlT1kX1xMQjmecJTy1k93ADoZ6SV6BeFoaryVCVsa1yGF-GNt_wE8NudmW17Zxasz5TrHsrKL2TQaoX7ZuDuD1-PspKsYUQUknweaPrY-2znYLp_DF8aXlwWCcX-2_9eJw7R4j8PFbcCZHa36s0TPMP8BGPa-AfYWsPkTXPsP9pgeTtlR4zUVFGzPVkWOVrSPf4"
                    />
                    <button className="w-full text-left px-4 py-4 text-primary text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
                        Show more
                    </button>
                </div>
            </div>

            {/* Active Friends */}
            <div className="bg-slate-100 dark:bg-surface-dark rounded-2xl overflow-hidden">
                <h3 className="text-sm font-bold p-4 pb-2 text-slate-500 uppercase tracking-widest">Active Friends</h3>
                <div className="flex flex-col px-2 py-2 gap-1">
                    <ActiveFriend
                        name="Marcus Webb"
                        avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuATfERFna-0TttHjfhuQM8Ja-wzP7ni7wdwBRVCK6LQkvcvZ23LNKSqscvnvdZt7tsWt5qN4ITu4KiPnM4Wr4m80QoJGG4onohlxm11gSB5H5-UuiBRUhAraIfgAjXpM9lFInd-y1cbYKw3sjJZ64tpOnACmAtoDkd1ZeutEi1s5XUpgk4WpRhdSF3mHRjbQbmlBguyZYbA9h7ulxBXg8tTidjQfch3YydpH00nHGe4Qf5GrjBW7koi6sht4x7rj5WG0ev-x5Y3Wlw"
                    />
                    <ActiveFriend
                        name="Sarah Jenkins"
                        avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuBOBkq_T63dlxIjE8hktGQH0r5-btInhBc6cNaSmI_UnP3Sa4AUH-_ekflEAjMGE5QOZojZiOVuO2N0E7mUZgt3MjlW7kzJ-tYCEMRzgVbn50ptsY8IDKn81m73F_aNQuxUxByDhc_Jys7Z7-8w6WVIFxrzjE24XjDxAnCodMrqH25GxmEt155UwGGZIdXLKeG94mTZxb8khkPs4GmAefL-rXsKEqfCsE_5wuSq_1pFLeQTycH1vZiB_ho487tfTu30qyFbffioGPo"
                    />
                </div>
            </div>

            {/* Footer */}
            <footer className="px-4 pb-8 text-[12px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mt-auto">
                <a className="hover:underline" href="#">Terms of Service</a>
                <a className="hover:underline" href="#">Privacy Policy</a>
                <a className="hover:underline" href="#">Cookie Policy</a>
                <a className="hover:underline" href="#">Accessibility</a>
                <a className="hover:underline" href="#">Ads info</a>
                <span>© 2024 SocialApp Corp.</span>
            </footer>
        </aside>
    )
}

function TrendingItem({ category, topic, posts }: { category: string, topic: string, posts: string }) {
    return (
        <a className="px-4 py-3 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all" href="#">
            <p className="text-xs text-slate-500">{category}</p>
            <p className="font-bold">{topic}</p>
            <p className="text-xs text-slate-500">{posts}</p>
        </a>
    )
}

function FollowSuggestion({ name, username, avatar }: { name: string, username: string, avatar: string }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer">
            <div className="size-10 rounded-full bg-slate-400 overflow-hidden shrink-0">
                <img className="w-full h-full object-cover" alt={name} src={avatar} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{name}</p>
                <p className="text-xs text-slate-500 truncate">{username}</p>
            </div>
            <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold hover:opacity-80 transition-all">
                Follow
            </button>
        </div>
    )
}

function ActiveFriend({ name, avatar }: { name: string, avatar: string }) {
    return (
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer">
            <div className="relative">
                <div className="size-9 rounded-full bg-slate-400 overflow-hidden">
                    <img className="w-full h-full object-cover" alt={name} src={avatar} />
                </div>
                <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-slate-100 dark:border-surface-dark rounded-full"></div>
            </div>
            <span className="text-sm font-medium truncate">{name}</span>
        </div>
    )
}
