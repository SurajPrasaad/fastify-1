"use client";

export default function SuperAdminSecurityDataRetention() {
    return (
        <div className="flex-1 flex flex-col bg-black text-[#E7E9EA] h-screen font-display overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2F3336] bg-black/90 backdrop-blur-md shrink-0 sticky top-0 z-20">
                <h1 className="text-[20px] font-bold tracking-[-0.02em]">Data Retention Policies</h1>
                <p className="text-[13px] text-[#71767B] mt-0.5">
                    Configure retention timelines and simulate the impact of expiry schedules.
                </p>
            </div>
        </div>
    );
}

