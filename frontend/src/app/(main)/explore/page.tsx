"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const CATEGORIES = [
    "Trending", "For You", "Technology", "Art & Design", "Music", "Sports"
]

const EXPLORE_ITEMS = [
    {
        id: "1",
        tag: "#DigitalArt",
        isTrending: true,
        likes: "12k",
        comments: "240",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2C6VR2eLjlkdgqHoazNK3vQBpF3Xs5qQi6YdWbat_Hqvvd0LxAcndjVWyxVBdZFEv6muYvYVB7-1Rz0OrnpsoQIcGDqfwlu6WotNMSrAvNz6YSWlNUVd-gXQayxxsppYeqk43Eaw7GIPJybctBbQwgqm8cc12DskRnnzwKkUoAwc8QNIHApWpBFvfOPyHBPfrZcjdqVA2KP6SpvycO_BT5CUNKrfoV3lZzYBk9vpoJl4pmZ1J2EtPKYdkiuGPE8t-FlsW_FoHQzs"
    },
    {
        id: "2",
        tag: "#Nature",
        likes: "8.4k",
        comments: "112",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCG8eRuRy1zYn1rq3mxCmOVI31pUPK7OigzdLz_4S7IEOX5F9fv-4tzjtn5R9BHUfOPySQefTeZD3Ch50Ln_bkCq5b9ItHy-xWUMYwXnZZ-CkhspsIJRYRQKZL6LhB3ESfoZZr32fau5MuUlX3RMxIg8uxOx-uVacbpFYubgaPeSbeSnCtYe-eXpW82omCYREHu1tfbhXbYEGVuiSFB46DmNVGGcsht6R8rU-6dclGYM1EYJYIMCDYD0UlBrLiNg09qrFa6lnuda2o"
    },
    {
        id: "3",
        tag: "#DesignInspo",
        likes: "15k",
        comments: "430",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuASO5ErRAWdrmufBdaoQkrixuEn0zlJsVkyZprcdDnZLlas5soWsM6CkSWZsOhH1POMJdFKRBNqEkWoF0wPR6H6ONsvNzyS1bu6WP7qH6Ns0rUP6gyX-FTRqCzraaAZUANAuFCEpaetbz7C0RtViVnZVcUEI1Y4DLn9-7EwKz3-R01pBRPc6hM8y0Ak-mWOUEHxJZPjB4hRW17XWTChyyxJIONTJPh-UFUBryUo5QfPGu4Phs8htQoN7AjhkAI3pCl_mr-tO40ssVU"
    },
    {
        id: "4",
        tag: "#CityVibes",
        likes: "5.2k",
        comments: "88",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBKBftC9McH1BGPF463nv8r8avNmga2QgmCMUgGfWaMuWA2cdD-b45Bv5vfM2Fgy_hgYAzbFXW5n6-je_WXYp7z12LQsFVdhmV455YF3DKZvCr-OSA6Jblb9wYGGK7ENoeyQzF0aexs7LhMWN7m9EpUhFWGtVyF7fhgJbRygWpp0aP3474HYqpE58Yl1FSs4arDh0lqzBg0fxQ5-0nxrGLudz0z6toPhoihh7ut8ICfP-QOOs78c1bU1ITeo8H28Kht2zvBBKbnm4U"
    },
    {
        id: "5",
        tag: "#TechRetro",
        likes: "21k",
        comments: "1.2k",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuvaoKsTEk4TP1CCkFljPPkcpnmpEuoc7U5qa49YDuZPQmKRtEf1jUsMnI2005G2VDVNsvHvG7busYwe05Y0-EuaZLtkCGbiZ6psr2MyjVo6lLg17xbEsptje8msvEYGIPOZCIGxJ0u7w1GRxaHEOxxDyGVfgQLt6YQrl4m_IObjdEl_s_MFEB95pUkUearHoLXJ5lMz-Sfbzl_29TtzO8yRPMxa6SuVxDyLGL-STlm2JibpmI5RD0ODRkTm2lGUx_sWtTKJokWU8"
    },
    {
        id: "6",
        tag: "#Architecture",
        likes: "3.4k",
        comments: "45",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCpM9ok9LZW6H4_BVapuu1iJzZcOglpDsHgqCnkX78DLP-1sB5rm4QM4WbenAKPJ2hD8OBArmCTdx8WWynCHqGs4Ym0EWgOfjF2LNKgDLIMccSmY8nqOe1RtTucqmPAc3jg1GUUXdGl3a2mPZ1XJqGFYH8NiFhNMZh8IGbRelWKU_jxn5_83Jz55jePIRGdOpav5f9JVNmauMp4l-U7p6Feb6GD8yqCq2lbtYl6x92hMFaI45a0XgEm2KULhS3NX098WfW-gMQS94I"
    }
]

export default function ExplorePage() {
    const [activeCategory, setActiveCategory] = React.useState("Trending")

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
            {/* Top Search Bar */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50 px-6 py-4">
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                        search
                    </span>
                    <input
                        className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                        placeholder="Search trends, creators, and hashtags..."
                        type="text"
                    />
                </div>
            </header>

            {/* Category Swipe Tabs */}
            <section className="px-6 py-4 overflow-x-auto whitespace-nowrap hidden-scrollbar border-b border-slate-200 dark:border-slate-800/50">
                <div className="flex gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-6 py-2 rounded-full text-sm font-bold transition-all",
                                activeCategory === cat
                                    ? "bg-primary text-white"
                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            {/* Masonry Grid */}
            <section className="p-6">
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                    {EXPLORE_ITEMS.map(item => (
                        <div
                            key={item.id}
                            className="break-inside-avoid group relative rounded-2xl overflow-hidden cursor-pointer bg-slate-200 dark:bg-slate-800/30"
                        >
                            <img
                                className="w-full h-auto object-cover transition-transform group-hover:scale-105 duration-500"
                                alt={item.tag}
                                src={item.image}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                                <div className="flex items-center gap-2 mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <span className="text-white font-bold text-sm">{item.tag}</span>
                                    {item.isTrending && (
                                        <span className="bg-primary px-2 py-0.5 rounded text-[10px] text-white font-bold uppercase">Trending</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[18px]">favorite</span>
                                            <span className="text-xs font-bold">{item.likes}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                                            <span className="text-xs font-bold">{item.comments}</span>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-[18px] hover:scale-110 active:scale-90 transition-transform">bookmark</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
