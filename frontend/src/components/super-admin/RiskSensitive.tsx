"use client";

export default function SuperAdminRiskSensitive() {
    return (
        <div className="flex-1 flex flex-col bg-black text-[#E3E5E9] h-screen font-display overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2F3336] bg-black/90 backdrop-blur-md shrink-0 sticky top-0 z-20">
                <h1 className="text-[20px] font-bold tracking-[-0.02em]">Sensitive Categories</h1>
                <p className="text-[13px] text-[#71767B] mt-0.5">
                    Configure sensitive content categories and their enforcement levels.
                </p>
            </div>
        </div>
    );
}

