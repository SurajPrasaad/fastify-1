"use client";

export default function SuperAdminSettingsApi() {
    return (
        <div className="flex-1 flex flex-col bg-black text-[#E7E9EA] h-screen font-display overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2F3336] bg-black/90 backdrop-blur-md shrink-0 sticky top-0 z-20">
                <h1 className="text-[20px] font-bold tracking-[-0.02em]">API Management</h1>
                <p className="text-[13px] text-[#71767B] mt-0.5">
                    Manage API keys, scopes, and usage analytics for integrations.
                </p>
            </div>
        </div>
    );
}

