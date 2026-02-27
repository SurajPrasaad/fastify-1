"use client";

import React, { useState, useEffect } from "react";
import {
    Settings, Shield, Users, AlertTriangle, Bell,
    Key, Database, HardDrive, CreditCard, Activity,
    Search, Save, X, Info, CheckCircle2, Sliders,
    Trash2, Plus, Monitor, Lock, RefreshCw, UploadCloud
} from "lucide-react";

// ==========================================
// MOCK DATA
// ==========================================
const MENU_ITEMS = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'moderation', label: 'Moderation', icon: AlertTriangle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'api', label: 'API & Integrations', icon: Key },
    { id: 'storage', label: 'Storage & Media', icon: HardDrive },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'logs', label: 'Logs & Audit', icon: Activity },
];

const LOGS = [
    { id: 1, admin: "Sarah Connors", action: "UPDATE_RATE_LIMIT", field: "Security > Limits", old: "100/min", new: "50/min", time: "2 mins ago", ip: "192.168.1.5" },
    { id: 2, admin: "System Auto", action: "BACKUP_COMPLETE", field: "Storage", old: "-", new: "Success", time: "1 hr ago", ip: "127.0.0.1" },
    { id: 3, admin: "John Doe", action: "GRANT_ROLE", field: "Admin > Roles", old: "User", new: "Moderator", time: "3 hrs ago", ip: "10.0.0.22" },
];

// ==========================================
// COMMON UI COMPONENTS
// ==========================================

const SectionHeader = ({ title, description, badge }: { title: string, description?: string, badge?: number }) => (
    <div className="mb-8 border-b border-[#2F3336] pb-5">
        <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-bold text-[#E7E9EA] tracking-tight">{title}</h2>
            {badge && badge > 0 && (
                <span className="px-2 py-0.5 bg-[#1D9BF0]/10 text-[#1D9BF0] border border-[#1D9BF0]/20 rounded-full text-[12px] font-bold">
                    {badge} pending changes
                </span>
            )}
        </div>
        {description && <p className="text-[#71767B] text-[14px] mt-1.5">{description}</p>}
    </div>
);

const Card = ({ children, title, subtitle, isDanger = false }: { children: React.ReactNode, title?: string, subtitle?: string, isDanger?: boolean }) => (
    <div className={`bg-[#16181C] border ${isDanger ? 'border-[#F91880]/30' : 'border-[#2F3336]'} rounded-xl p-6 shadow-sm mb-6`}>
        {(title || subtitle) && (
            <div className={`mb-5 ${isDanger ? 'text-[#F91880]' : ''}`}>
                {title && <h3 className={`text-[16px] font-bold ${isDanger ? 'text-[#F91880]' : 'text-[#E7E9EA]'}`}>{title}</h3>}
                {subtitle && <p className="text-[13px] text-[#71767B] mt-1">{subtitle}</p>}
            </div>
        )}
        {children}
    </div>
);

const Toggle = ({ label, description, checked, onChange, isDanger }: any) => (
    <div className="flex items-center justify-between py-3">
        <div className="pr-10">
            <p className={`text-[14px] font-bold ${isDanger ? 'text-[#F91880]' : 'text-[#E7E9EA]'}`}>{label}</p>
            {description && <p className="text-[13px] text-[#71767B] mt-0.5">{description}</p>}
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className={`w-11 h-6 bg-[#2F3336] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#71767B] peer-checked:after:bg-white after:border-gray-300 after:border-0 after:rounded-full after:h-5 after:w-5 after:transition-all ${checked ? (isDanger ? 'peer-checked:bg-[#F91880]' : 'peer-checked:bg-[#1D9BF0]') : ''}`}></div>
        </label>
    </div>
);

const Input = ({ label, placeholder, type = "text", value, onChange, prefix, suffix, monospace = false }: any) => (
    <div className="mb-4 last:mb-0">
        <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2">{label}</label>
        <div className="relative">
            {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71767B] text-[13px] font-mono">{prefix}</span>}
            <input
                type={type}
                className={`w-full bg-[#000000] border border-[#2F3336] text-[#E7E9EA] rounded-lg py-2.5 outline-none focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#1D9BF0]/50 transition-all ${prefix ? 'pl-10' : 'pl-3'} ${suffix ? 'pr-10' : 'pr-3'} ${monospace ? 'font-mono text-[13px]' : 'text-[14px]'}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
            {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71767B] text-[13px]">{suffix}</span>}
        </div>
    </div>
);

const Select = ({ label, value, onChange, options }: any) => (
    <div className="mb-4 last:mb-0">
        <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2">{label}</label>
        <select
            value={value}
            onChange={onChange}
            className="w-full bg-[#000000] border border-[#2F3336] text-[#E7E9EA] rounded-lg px-3 py-2.5 outline-none focus:border-[#1D9BF0] transition-all text-[14px] cursor-pointer"
        >
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);


// ==========================================
// MAIN PAGE CONTENT
// ==========================================

export default function SettingsConsolePage() {
    const [activeTab, setActiveTab] = useState('general');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Form States
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [autoModeration, setAutoModeration] = useState(true);
    const [require2FA, setRequire2FA] = useState(false);

    const triggerChange = () => setHasUnsavedChanges(true);

    const handleSave = () => {
        // Simulate API call
        setTimeout(() => setHasUnsavedChanges(false), 500);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="animate-in fade-in duration-300">
                        <SectionHeader
                            title="General Settings"
                            description="Configure core platform identity, regional localization, default behavioral overrides, and limits."
                        />

                        {/* 1. PLATFORM IDENTITY */}
                        <Card title="Platform Identity" subtitle="Core branding and public-facing visual identity configurations">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                <div className="space-y-4">
                                    <Input label="Platform Name" value="DevAtlas Social" onChange={triggerChange} />
                                    <Input label="Platform Tagline" value="Connecting developers globally." onChange={triggerChange} />

                                    <div className="flex gap-4 pt-2">
                                        <div className="flex-1">
                                            <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2">Primary Color</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-8 h-8 rounded-md bg-[#1D9BF0] border border-[#2F3336]"></div>
                                                <input type="text" value="#1D9BF0" className="w-[100px] bg-[#000000] border border-[#2F3336] text-[#E7E9EA] rounded-md py-1.5 px-3 outline-none font-mono text-[13px]" onChange={triggerChange} />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2">Secondary Color</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-8 h-8 rounded-md bg-[#00BA7C] border border-[#2F3336]"></div>
                                                <input type="text" value="#00BA7C" className="w-[100px] bg-[#000000] border border-[#2F3336] text-[#E7E9EA] rounded-md py-1.5 px-3 outline-none font-mono text-[13px]" onChange={triggerChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#2F3336] rounded-xl hover:border-[#1D9BF0] bg-[#000000] transition-colors cursor-pointer group">
                                        <div className="w-16 h-16 bg-[#16181C] rounded-lg mb-4 flex items-center justify-center group-hover:bg-[#1D9BF0]/10 transition-colors">
                                            <UploadCloud className="w-8 h-8 text-[#71767B] group-hover:text-[#1D9BF0]" />
                                        </div>
                                        <span className="text-[14px] font-bold text-[#E7E9EA]">Upload Platform Logo</span>
                                        <span className="text-[12px] text-[#71767B] mt-1">Recommended: 512x512px (PNG, SVG)</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#2F3336] rounded-xl hover:border-[#71767B] bg-[#000000] transition-colors cursor-pointer">
                                        <span className="text-[13px] font-semibold text-[#E7E9EA]">Upload Favicon (.ico)</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* 2. LOCALIZATION & REGIONAL */}
                        <Card title="Localization & Regional" subtitle="Set standard formats for dates, times, languages, and regional restrictions">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <Select label="Default Language" options={[{ label: "🇺🇸 English (US)", value: "en-US" }, { label: "🇪🇸 Spanish", value: "es" }, { label: "🇫🇷 French", value: "fr" }]} onChange={triggerChange} />
                                <Select label="Default Timezone" options={[{ label: "UTC (Coordinated Universal Time)", value: "UTC" }, { label: "EST (America/New_York)", value: "EST" }, { label: "GMT (Europe/London)", value: "GMT" }]} onChange={triggerChange} />

                                <Select label="Date Format" options={[
                                    { label: "MM/DD/YYYY (e.g. 12/31/2026)", value: "us" },
                                    { label: "DD/MM/YYYY (e.g. 31/12/2026)", value: "eu" },
                                    { label: "YYYY-MM-DD (e.g. 2026-12-31)", value: "iso" }
                                ]} onChange={triggerChange} />

                                <Select label="Time Format" options={[
                                    { label: "12-hour (e.g. 2:30 PM)", value: "12h" },
                                    { label: "24-hour (e.g. 14:30)", value: "24h" }
                                ]} onChange={triggerChange} />

                                <div className="md:col-span-2 mt-2 pt-4 border-t border-[#2F3336]">
                                    <Toggle
                                        label="Enforce Region Restrictions"
                                        description="Prevent access to the platform from IP addresses located in restricted or embargoed countries."
                                        checked={true}
                                        onChange={triggerChange}
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* 3. PLATFORM BEHAVIOR */}
                        <Card title="Platform Behavior" subtitle="Control signup rules, roles, and maintenance locks">
                            <div className="space-y-2">
                                <Toggle
                                    label="Enable Public Signup"
                                    description="Allow anyone to create a new account on the platform without requiring an invite."
                                    checked={true}
                                    onChange={triggerChange}
                                />
                                <Toggle
                                    label="Invite-Only Mode"
                                    description="Only users with valid invite codes can register. (Overrides Public Signup if enabled)"
                                    checked={false}
                                    onChange={triggerChange}
                                />
                                <div className="py-3 mt-2 border-t border-[#2F3336]">
                                    <div className="grid grid-cols-2 gap-6">
                                        <Select label="Default New User Role" options={[{ label: "Standard User", value: "user" }, { label: "Creator", value: "creator" }]} onChange={triggerChange} />
                                        <Select label="Default Landing Page" options={[{ label: "For You Feed", value: "feed" }, { label: "Explore / Trending", value: "explore" }]} onChange={triggerChange} />
                                    </div>
                                </div>
                                <div className="py-3 border-t border-[#2F3336]">
                                    <Toggle
                                        label="Maintenance Mode"
                                        description="Lock platform access instantly. Normal users will see a maintenance screen. Admins bypass this."
                                        checked={maintenanceMode}
                                        onChange={(e: any) => { setMaintenanceMode(e.target.checked); triggerChange(); }}
                                        isDanger
                                    />
                                    {maintenanceMode && (
                                        <div className="mt-3 p-3 bg-[#FFD400]/10 border border-[#FFD400]/20 rounded-lg flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-[#FFD400] shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[#E7E9EA] text-[13px] font-bold">Maintenance is Active</p>
                                                <p className="text-[#71767B] text-[12px] mt-0.5">The platform is currently locked. All non-admin API requests will return immediate 503s.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* 4. DEFAULT CONTENT SETTINGS */}
                        <Card title="Content Defaults" subtitle="Initial content visibility and moderation properties applied to new posts">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[13px] font-bold text-[#E7E9EA] mb-3">Default Post Privacy</label>
                                    <div className="space-y-2">
                                        {['Public (Everyone)', 'Followers Only', 'Private'].map((opt, i) => (
                                            <label key={opt} className="flex items-center gap-3 cursor-pointer">
                                                <input type="radio" name="privacy" defaultChecked={i === 0} className="w-4 h-4 accent-[#1D9BF0] bg-[#000000] border-[#2F3336]" onChange={triggerChange} />
                                                <span className="text-[14px] text-[#E7E9EA]">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-[#E7E9EA] mb-3">Default Comment Permissions</label>
                                    <div className="space-y-2">
                                        {['Everyone can comment', 'Followers only', 'No one (Disabled)'].map((opt, i) => (
                                            <label key={opt} className="flex items-center gap-3 cursor-pointer">
                                                <input type="radio" name="comments" defaultChecked={i === 0} className="w-4 h-4 accent-[#1D9BF0] bg-[#000000] border-[#2F3336]" onChange={triggerChange} />
                                                <span className="text-[14px] text-[#E7E9EA]">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* 5. PLATFORM LIMITS */}
                        <Card title="Platform Limits" subtitle="Set hard thresholds to ensure platform stability and prevent abuse">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                <div>
                                    <Input label="Max Post Length" type="number" suffix="chars" placeholder="280" onChange={triggerChange} />
                                    <p className="text-[11px] text-[#71767B] -mt-2">Limits the character count per standard text post.</p>
                                </div>
                                <div>
                                    <Input label="Max Upload File Size" type="number" suffix="MB" placeholder="50" onChange={triggerChange} />
                                    <p className="text-[11px] text-[#71767B] -mt-2">Global cap for images and video uploads.</p>
                                </div>
                                <div>
                                    <Input label="Max Video Duration" type="number" suffix="seconds" placeholder="120" onChange={triggerChange} />
                                    <p className="text-[11px] text-[#71767B] -mt-2">Videos exceeding this length will be rejected.</p>
                                </div>
                                <div>
                                    <Select label="Max Image Resolution" options={[{ label: "4K (3840x2160)", value: "4k" }, { label: "1080p (1920x1080)", value: "1080p" }, { label: "720p (1280x720)", value: "720p" }]} onChange={triggerChange} />
                                    <p className="text-[11px] text-[#71767B] -mt-2">All uploaded images will be compressed to this cap.</p>
                                </div>
                            </div>
                        </Card>

                        {/* 6. DANGER ZONE */}
                        <div className="border border-[#F91880]/30 bg-[#F91880]/5 rounded-xl p-6 shadow-sm mb-6 mt-10">
                            <div className="flex items-center gap-2 mb-5">
                                <AlertTriangle className="w-5 h-5 text-[#F91880]" />
                                <h3 className="text-[18px] font-bold text-[#F91880]">Danger Zone</h3>
                            </div>

                            <div className="space-y-4 divide-y divide-[#F91880]/20">
                                <div className="flex items-center justify-between pb-4">
                                    <div className="pr-6">
                                        <h4 className="text-[14px] font-bold text-[#E7E9EA]">Clear System Cache</h4>
                                        <p className="text-[13px] text-[#71767B] mt-0.5">Purge global Redis caches resolving stale propogation issues. May cause temporary latency spikes.</p>
                                    </div>
                                    <button className="px-4 py-2 bg-transparent border border-[#2F3336] text-[#E7E9EA] rounded-md font-bold text-[13px] hover:bg-[#F91880]/10 hover:border-[#F91880]/50 hover:text-[#F91880] transition-colors shrink-0">Clear Cache</button>
                                </div>

                                <div className="flex items-center justify-between py-4">
                                    <div className="pr-6">
                                        <h4 className="text-[14px] font-bold text-[#E7E9EA]">Reset Platform Configuration</h4>
                                        <p className="text-[13px] text-[#71767B] mt-0.5">Returns all settings on this page back to their factory installation defaults.</p>
                                    </div>
                                    <button className="px-4 py-2 bg-[#F91880]/10 border border-[#F91880]/30 text-[#F91880] rounded-md font-bold text-[13px] hover:bg-[#F91880] hover:text-white transition-colors shrink-0">Reset Settings</button>
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <div className="pr-6">
                                        <h4 className="text-[14px] font-bold text-[#E7E9EA]">Archive Platform Data</h4>
                                        <p className="text-[13px] text-[#71767B] mt-0.5">Places the entire platform into strict read-only mode and initiates a global data-export sequence.</p>
                                    </div>
                                    <button className="px-4 py-2 bg-[#F91880] text-white rounded-md font-bold text-[13px] hover:bg-[#E01470] transition-colors shrink-0 flex items-center gap-2">
                                        <Lock className="w-4 h-4" /> Archive Platform
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                );
            case 'security':
                return (
                    <div className="animate-in fade-in duration-300">
                        <SectionHeader title="Security Controls" description="Manage session lifetimes, API protection, and global security policies." />

                        <Card title="Session Management">
                            <div className="grid grid-cols-2 gap-6">
                                <Input label="Session Timeout Duration" placeholder="e.g. 14" suffix="days" type="number" onChange={triggerChange} />
                                <Input label="JWT Expiry Duration" placeholder="e.g. 15" suffix="mins" type="number" onChange={triggerChange} />
                            </div>
                            <div className="mt-4 border-t border-[#2F3336] pt-4">
                                <Toggle
                                    label="Enforce 2FA for Admins"
                                    description="Require two-factor authentication for all users with Admin or Super Admin roles."
                                    checked={require2FA}
                                    onChange={(e: any) => { setRequire2FA(e.target.checked); triggerChange(); }}
                                    isDanger
                                />
                            </div>
                        </Card>

                        <Card title="Rate Limiting & Protection">
                            <div className="space-y-4">
                                <div className="p-4 bg-[#000000] border border-[#2F3336] rounded-lg flex items-center justify-between">
                                    <div>
                                        <h4 className="text-[14px] font-bold text-[#E7E9EA]">Global API Rate Limit</h4>
                                        <p className="text-[12px] text-[#71767B]">Limit maximum requests per IP.</p>
                                    </div>
                                    <div className="w-[150px]">
                                        <Input placeholder="1000" suffix="/ hr" onChange={triggerChange} />
                                    </div>
                                </div>
                                <div className="p-4 bg-[#000000] border border-[#2F3336] rounded-lg flex items-center justify-between">
                                    <div>
                                        <h4 className="text-[14px] font-bold text-[#E7E9EA]">Brute-force Protection</h4>
                                        <p className="text-[12px] text-[#71767B]">Lock account after multiple failed login attempts.</p>
                                    </div>
                                    <Toggle checked={true} onChange={triggerChange} />
                                </div>
                                <div className="p-4 bg-[#000000] border border-[#2F3336] rounded-lg">
                                    <h4 className="text-[14px] font-bold text-[#E7E9EA] mb-3">IP Allowlist (Admin Dashboard)</h4>
                                    <textarea
                                        rows={3}
                                        placeholder="Enter IP addresses separated by commas (e.g. 192.168.1.1, 10.0.0.0/24)"
                                        className="w-full bg-[#16181C] border border-[#2F3336] rounded-md p-3 text-[13px] font-mono text-[#E7E9EA] outline-none focus:border-[#1D9BF0]"
                                        onChange={triggerChange}
                                    ></textarea>
                                </div>
                            </div>
                        </Card>

                        <Card title="Danger Zone" isDanger>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-[14px] font-bold text-[#E7E9EA]">Revoke All Active Sessions</h4>
                                    <p className="text-[12px] text-[#71767B] max-w-sm">Immediately invalidate all user sessions across the platform. Users will be forced to log in again.</p>
                                </div>
                                <button className="px-5 py-2.5 bg-[#F91880]/10 text-[#F91880] border border-[#F91880]/20 rounded-lg font-bold text-[13px] hover:bg-[#F91880] hover:text-white transition-colors">
                                    Revoke Sessions
                                </button>
                            </div>
                        </Card>
                    </div>
                );
            case 'admin':
                return (
                    <div className="animate-in fade-in duration-300">
                        <SectionHeader title="Role-Based Access Control (RBAC)" description="Configure role permissions and manage administrative users across the organization." />

                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[16px] font-bold text-[#E7E9EA]">Permission Matrix</h3>
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#16181C] border border-[#2F3336] rounded-md text-[13px] hover:bg-[#2F3336] font-bold transition-colors">
                                <Plus className="w-4 h-4" /> New Role
                            </button>
                        </div>

                        <div className="border border-[#2F3336] rounded-xl overflow-hidden mb-8 bg-[#16181C]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[13px]">
                                    <thead className="bg-[#000000] text-[#71767B] uppercase font-bold text-[11px] border-b border-[#2F3336]">
                                        <tr>
                                            <th className="px-5 py-3">Permission Level</th>
                                            <th className="px-5 py-3 text-center border-l border-[#2F3336] min-w-[120px]">Super Admin</th>
                                            <th className="px-5 py-3 text-center border-l border-[#2F3336] min-w-[120px]">App Admin</th>
                                            <th className="px-5 py-3 text-center border-l border-[#2F3336] min-w-[120px]">Moderator</th>
                                            <th className="px-5 py-3 text-center border-l border-[#2F3336] min-w-[120px]">Support Spec.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2F3336]">
                                        {[
                                            { name: "Manage System Settings", sa: true, aa: false, mo: false, sp: false },
                                            { name: "Manage Billing & Plans", sa: true, aa: false, mo: false, sp: false },
                                            { name: "Moderate global content", sa: true, aa: true, mo: true, sp: false },
                                            { name: "View Audit Logs", sa: true, aa: true, mo: false, sp: true },
                                            { name: "Suspend User Accounts", sa: true, aa: true, mo: true, sp: false },
                                            { name: "Respond to Support Tickets", sa: true, aa: true, mo: true, sp: true },
                                        ].map((row, idx) => (
                                            <tr key={idx} className="hover:bg-[#202327]">
                                                <td className="px-5 py-3 font-semibold text-[#E7E9EA]">{row.name}</td>
                                                <td className="px-5 py-3 text-center border-l border-[#2F3336]"><input type="checkbox" checked={row.sa} disabled className="accent-[#1D9BF0] w-4 h-4 cursor-not-allowed" /></td>
                                                <td className="px-5 py-3 text-center border-l border-[#2F3336]"><input type="checkbox" checked={row.aa} onChange={triggerChange} className="accent-[#1D9BF0] w-4 h-4 cursor-pointer" /></td>
                                                <td className="px-5 py-3 text-center border-l border-[#2F3336]"><input type="checkbox" checked={row.mo} onChange={triggerChange} className="accent-[#1D9BF0] w-4 h-4 cursor-pointer" /></td>
                                                <td className="px-5 py-3 text-center border-l border-[#2F3336]"><input type="checkbox" checked={row.sp} onChange={triggerChange} className="accent-[#1D9BF0] w-4 h-4 cursor-pointer" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'moderation':
                return (
                    <div className="animate-in fade-in duration-300">
                        <SectionHeader title="Moderation Rules" description="Configure automated filters and content thresholds." />

                        <Card title="Automation Pipeline">
                            <Toggle
                                label="AI Auto-Moderation Engine"
                                description="Automatically scan and flag posts containing hate speech, nudity, or spam before they hit the feed."
                                checked={autoModeration}
                                onChange={(e: any) => { setAutoModeration(e.target.checked); triggerChange(); }}
                            />

                            {autoModeration && (
                                <div className="mt-4 p-4 bg-[#000000] border border-[#2F3336] rounded-lg flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2">Flagging Confidence Threshold</label>
                                        <input type="range" min="0" max="100" defaultValue="85" className="w-full accent-[#1D9BF0]" onChange={triggerChange} />
                                        <div className="flex justify-between text-[11px] text-[#71767B] mt-1">
                                            <span>Lenient (50%)</span>
                                            <span>Strict (95%)</span>
                                        </div>
                                    </div>
                                    <div className="w-16 h-10 bg-[#16181C] border border-[#2F3336] rounded flex items-center justify-center font-bold text-[#1D9BF0]">
                                        85%
                                    </div>
                                </div>
                            )}
                        </Card>

                        <Card title="Banned Keywords Filter">
                            <p className="text-[13px] text-[#71767B] mb-4">Any posts or comments containing these exact strings will be instantly dropped.</p>
                            <div className="p-3 border border-[#2F3336] rounded-lg bg-[#000000] flex flex-wrap gap-2 min-h-[100px] mb-3">
                                {['spam_link.com', 'buy_followers_now', 'free_crypto_giveaway'].map(tag => (
                                    <span key={tag} className="px-2.5 py-1 bg-[#2F3336] text-[#E7E9EA] rounded-full text-[12px] flex items-center gap-1.5">
                                        {tag} <X className="w-3 h-3 hover:text-[#F91880] cursor-pointer" />
                                    </span>
                                ))}
                                <input type="text" placeholder="Type keyword and press Enter..." className="bg-transparent outline-none text-[13px] text-[#E7E9EA] flex-1 min-w-[150px]" onChange={triggerChange} />
                            </div>
                        </Card>
                    </div>
                );
            case 'logs':
                return (
                    <div className="animate-in fade-in duration-300">
                        <SectionHeader title="Audit Logs" description="Immutable record of administrative actions taken inside the console." />

                        <div className="bg-[#16181C] border border-[#2F3336] rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col h-[600px]">
                            <div className="px-5 py-4 border-b border-[#2F3336] flex items-center justify-between bg-[#000000]">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71767B]" />
                                    <input type="text" placeholder="Search logs..." className="w-[280px] bg-[#16181C] border border-[#2F3336] text-[13px] text-[#E7E9EA] rounded-md py-1.5 pl-9 pr-3 outline-none focus:border-[#1D9BF0] transition-colors" />
                                </div>
                                <button className="flex items-center gap-2 text-[#71767B] hover:text-[#E7E9EA] text-[13px] font-semibold transition-colors">
                                    <RefreshCw className="w-4 h-4" /> Refresh
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-left text-[13px] whitespace-nowrap">
                                    <thead className="bg-[#16181C] text-[#71767B] font-bold text-[11px] uppercase tracking-wider border-b border-[#2F3336] sticky top-0 z-10 backdrop-blur-md">
                                        <tr>
                                            <th className="px-5 py-3">Timestamp</th>
                                            <th className="px-5 py-3">Admin</th>
                                            <th className="px-5 py-3">Action Type</th>
                                            <th className="px-5 py-3">Module</th>
                                            <th className="px-5 py-3">IP Address</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2F3336] bg-[#000000]">
                                        {LOGS.map((log) => (
                                            <tr key={log.id} className="hover:bg-[#16181C]/80 transition-colors cursor-pointer group">
                                                <td className="px-5 py-3 font-mono text-[#71767B] text-[12px]">{log.time}</td>
                                                <td className="px-5 py-3 font-semibold text-[#E7E9EA]">{log.admin}</td>
                                                <td className="px-5 py-3 font-mono text-[11px]"><span className="px-2 py-1 bg-[#2F3336]/40 border border-[#2F3336] rounded text-[#E7E9EA]">{log.action}</span></td>
                                                <td className="px-5 py-3 text-[#71767B]">{log.field}</td>
                                                <td className="px-5 py-3 font-mono text-[#71767B] text-[12px]">{log.ip}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-[500px] text-[#71767B] animate-in fade-in">
                        <Sliders className="w-16 h-16 mb-4 opacity-20" />
                        <h3 className="text-[18px] font-bold text-[#E7E9EA]">Module Loading...</h3>
                        <p className="text-[14px] mt-2 max-w-sm text-center">The {activeTab} module configurations will appear here dynamically.</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-[100vh] bg-[#000000] text-[#E7E9EA] relative overflow-hidden font-display">


            {/* SECONDARY SIDEBAR (Settings Navigation) */}
            <div className="w-[260px] bg-[#16181C] border-r border-[#2F3336] flex flex-col shrink-0 overflow-y-auto">
                <div className="p-6 pb-2 sticky top-0 bg-[#16181C] z-10">
                    <h1 className="text-[20px] font-bold text-[#E7E9EA] flex items-center gap-2">
                        <Settings className="w-5 h-5 text-[#1D9BF0]" /> Settings Console
                    </h1>
                    <p className="text-[13px] text-[#71767B] mt-1 leading-snug">Global configuration parameters.</p>
                </div>

                <nav className="p-3 space-y-1">
                    {MENU_ITEMS.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${isActive ? 'bg-[#1D9BF0]/10 text-[#1D9BF0] font-bold' : 'text-[#E7E9EA] hover:bg-[#2F3336] font-medium'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#1D9BF0]' : 'text-[#71767B]'}`} />
                                    <span className="text-[14px]">{item.label}</span>
                                </div>
                                {hasUnsavedChanges && activeTab === item.id && (
                                    <div className="w-2 h-2 rounded-full bg-[#1D9BF0]"></div>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col relative overflow-hidden">

                {/* Header Breadcrumb */}
                <div className="h-[60px] border-b border-[#2F3336] flex items-center px-8 bg-[#000000]/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
                    <div className="flex items-center gap-2 text-[14px] font-medium text-[#71767B]">
                        <span>Settings</span>
                        <span className="text-[#2F3336]">&gt;</span>
                        <span className="text-[#E7E9EA] capitalize">{MENU_ITEMS.find(m => m.id === activeTab)?.label}</span>
                    </div>
                </div>

                {/* Configuration Panel */}
                <div className="flex-1 overflow-y-auto p-8 relative pb-32">
                    <div className="max-w-[900px]">
                        {renderContent()}
                    </div>
                </div>

                {/* STICKY SAVE BAR */}
                {hasUnsavedChanges && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#16181C] border border-[#2F3336] px-6 py-4 rounded-full shadow-2xl flex items-center justify-between gap-8 min-w-[500px] animate-in slide-in-from-bottom-10 fade-in duration-300 z-50">
                        <div className="flex items-center gap-3">
                            <Info className="w-5 h-5 text-[#FFD400]" />
                            <span className="text-[14px] font-bold text-[#E7E9EA]">You have unsaved changes</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setHasUnsavedChanges(false)} className="px-4 py-2 text-[13px] font-bold text-[#E7E9EA] hover:bg-[#2F3336] rounded-full transition-colors">Discard</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-[#1D9BF0] text-white text-[13px] font-bold rounded-full flex items-center gap-2 hover:bg-[#1A8CD8] shadow-[0_0_15px_rgba(29,155,240,0.3)] transition-all">
                                <Save className="w-4 h-4" /> Save Configuration
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

