"use client";

export default function SuperAdminSecurityAdminLogs() {
    return (
        <div className="flex-1 flex flex-col bg-black text-[#E7E9EA] h-screen font-display overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2F3336] bg-black/90 backdrop-blur-md shrink-0 sticky top-0 z-20">
                <h1 className="text-[20px] font-bold tracking-[-0.02em]">Admin Activity Logs</h1>
                <p className="text-[13px] text-[#71767B] mt-0.5">
                    Timeline of super admin and admin-level activity for compliance review.
                </p>
            </div>
        </div>
    );
}

