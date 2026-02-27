"use client";

import React, { useState } from "react";
import {
    Settings, Shield, Users, AlertTriangle, Bell, Lock, Key, HardDrive, CreditCard, Activity,
    Search, Save, X, Info, ShieldCheck, UserCheck, Clock, Download, Regex, Globe
} from "lucide-react";

// ==========================================
// MOCK DATA
// ==========================================
const MENU_ITEMS = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'admin', label: 'Admin & Roles', icon: Users },
    { id: 'policies', label: 'User Policies', icon: Shield },
    { id: 'moderation', label: 'Moderation', icon: AlertTriangle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'api', label: 'API & Integrations', icon: Key },
    { id: 'storage', label: 'Storage & Media', icon: HardDrive },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'logs', label: 'Logs & Audit', icon: Activity },
];

const PRESET_BANNED_WORDS = ['admin', 'moderator', 'support', 'system', 'root'];

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

const RiskBadge = ({ level }: { level: 'Low' | 'Medium' | 'High' | 'Critical' }) => {
    const styles = {
        'Low': 'bg-[#00BA7C]/10 text-[#00BA7C] border-[#00BA7C]/20',
        'Medium': 'bg-[#FFD400]/10 text-[#FFD400] border-[#FFD400]/20',
        'High': 'bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20',
        'Critical': 'bg-[#F91880]/10 text-[#F91880] border-[#F91880]/20',
    };
    return (
        <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider ${styles[level]}`}>
            {level} Risk
        </span>
    );
};

const Card = ({ children, title, subtitle, riskLevel, onFocus }: any) => (
    <div
        className="bg-[#16181C] border border-[#2F3336] rounded-xl p-6 shadow-sm mb-6 focus-within:border-[#1D9BF0] transition-colors"
        onClick={onFocus}
    >
        <div className="flex items-start justify-between mb-5">
            <div>
                <h3 className="text-[16px] font-bold text-[#E7E9EA]">{title}</h3>
                {subtitle && <p className="text-[13px] text-[#71767B] mt-1">{subtitle}</p>}
            </div>
            {riskLevel && <RiskBadge level={riskLevel} />}
        </div>
        <div className="space-y-5">
            {children}
        </div>
    </div>
);

const Toggle = ({ label, description, checked, onChange, isDanger }: any) => (
    <div className="flex items-center justify-between">
        <div className="pr-10">
            <p className={`text-[14px] font-bold ${isDanger ? 'text-[#F91880]' : 'text-[#E7E9EA]'}`}>{label}</p>
            {description && <p className="text-[12px] text-[#71767B] mt-0.5 leading-snug">{description}</p>}
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className={`w-11 h-6 bg-[#2F3336] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#71767B] peer-checked:after:bg-white after:border-gray-300 after:border-0 after:rounded-full after:h-5 after:w-5 after:transition-all ${checked ? (isDanger ? 'peer-checked:bg-[#F91880]' : 'peer-checked:bg-[#1D9BF0]') : ''}`}></div>
        </label>
    </div>
);

const Input = ({ label, placeholder, type = "text", value, onChange, suffix, width = "full" }: any) => (
    <div>
        <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2">{label}</label>
        <div className="relative">
            <input
                type={type}
                className={`w-${width} bg-[#000000] border border-[#2F3336] text-[#E7E9EA] rounded-lg py-2 pl-3 ${suffix ? 'pr-12' : 'pr-3'} outline-none focus:border-[#1D9BF0] transition-all text-[13px]`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
            {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71767B] text-[12px] font-mono">{suffix}</span>}
        </div>
    </div>
);


// ==========================================
// MAIN PAGE CONTENT
// ==========================================

export default function UserPoliciesPage() {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [activeContext, setActiveContext] = useState<string | null>('creation');

    // Policy States
    const [policies, setPolicies] = useState({
        publicSignup: true,
        inviteOnly: false,
        emailVerif: true,
        phoneVerif: false,
        captcha: true,
        maxAccPerEmail: 1,
        maxAccPerIP: 3,
        userMinLen: 4,
        userMaxLen: 15,
        userUnique: true,
        passMinLen: 12,
        passUpper: true,
        passLower: true,
        passNum: true,
        passSpec: true,
        passExp: 90,
        ageMin: 13,
        ageVerif: false,
        delDelay: 30,
        sessMax: 3,
        sessTimeout: 14
    });

    const triggerChange = (key: keyof typeof policies, value: any) => {
        setPolicies(prev => ({ ...prev, [key]: value }));
        setHasUnsavedChanges(true);
    };

    const handleSave = () => {
        setTimeout(() => setHasUnsavedChanges(false), 500);
    };

    const getPasswordStrength = () => {
        let score = 0;
        if (policies.passMinLen >= 12) score += 1;
        if (policies.passMinLen >= 16) score += 1;
        if (policies.passUpper) score += 1;
        if (policies.passLower) score += 1;
        if (policies.passNum) score += 1;
        if (policies.passSpec) score += 1;

        if (score >= 5) return { label: 'Strong', color: 'text-[#00BA7C]' };
        if (score >= 3) return { label: 'Moderate', color: 'text-[#FFD400]' };
        return { label: 'Weak', color: 'text-[#F91880]' };
    };

    const pwdStrength = getPasswordStrength();

    // Context Data Mapping
    const CONTEXT_DATA: Record<string, { title: string, desc: string, risk: string, compliance: string }> = {
        'creation': {
            title: 'Account Creation Policies',
            desc: 'Dictates barriers to entry. Disabling CAPTCHA or Verification significantly increases bot traffic and spam likelihood.',
            risk: 'Medium (High if verification disabled)',
            compliance: 'GDPR Article 5 - Data Minimization considerations apply for Phone Verification.'
        },
        'username': {
            title: 'Username Policies',
            desc: 'Governs identity string formatting. Ensure blocked words cover platform-specific administrative terms to prevent impersonation.',
            risk: 'Low',
            compliance: 'None strictly applicable.'
        },
        'password': {
            title: 'Password Policies',
            desc: 'Sets cryptographic difficulty. NIST recommends minimum 8 chars, but enterprise standard is 12+ with multi-factor authentication (managed in Security tab).',
            risk: 'Critical',
            compliance: 'PCI-DSS Req 8 / SOC2 Type II requirements validate password complexity rules.'
        },
        'age': {
            title: 'Age & Region Restrictions',
            desc: 'Controls legal onboarding limits. If Age Verification is active, a third-party flow (e.g. Persona/Stripe Identity) will intercept the signup.',
            risk: 'Critical',
            compliance: 'COPPA (US: 13+), GDPR (EU: 13-16+ depending on state).'
        },
        'lifecycle': {
            title: 'Account Lifecycle & Deletion',
            desc: 'Manages automated purges and user-instigated deletion latency. A grace period allows account recovery if compromised and deleted maliciously.',
            risk: 'Medium',
            compliance: 'GDPR Right to Erasure mandates deletion without undue delay (max 30 days).'
        }
    };

    const activeContextData = activeContext ? CONTEXT_DATA[activeContext] : null;

    return (
        <div className="flex h-[100vh] bg-[#000000] text-[#E7E9EA] relative overflow-hidden font-display">
            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col relative overflow-hidden">

                {/* Header Breadcrumb */}
                <div className="h-[72px] border-b border-[#2F3336] flex items-center justify-between px-8 bg-[#000000]/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-[#1D9BF0]" />
                            <h2 className="text-[20px] font-bold text-[#E7E9EA]">User Policies</h2>
                            <span className="px-2 py-0.5 bg-[#00BA7C]/10 text-[#00BA7C] border border-[#00BA7C]/20 rounded-full text-[11px] font-bold uppercase tracking-wider ml-2">Production</span>
                        </div>
                        <p className="text-[#71767B] text-[13px] mt-0.5">Define global rules governing accounts, auth, and lifecycles.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71767B]" />
                            <input type="text" placeholder="Search policies..." className="w-[200px] bg-[#16181C] border border-[#2F3336] text-[13px] text-[#E7E9EA] rounded-md py-1.5 pl-9 pr-3 outline-none focus:border-[#1D9BF0] transition-colors" />
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-[#16181C] border border-[#2F3336] hover:bg-[#2F3336] text-[#E7E9EA] rounded-md text-[13px] font-bold transition-colors shadow-sm">
                            <Download className="w-4 h-4" /> Export JSON
                        </button>
                    </div>
                </div>

                {/* THREE COLUMN GRID (Main Policies + Context Drawer) */}
                <div className="flex-1 overflow-hidden flex">

                    <div className="flex-1 overflow-y-auto p-8 relative pb-32">
                        <div className="max-w-[750px]">

                            {/* 1. ACCOUNT CREATION */}
                            <div onClick={() => setActiveContext('creation')}>
                                <Card title="1. Account Creation" subtitle="Control how users enter the platform and verification hurdles." riskLevel={!policies.emailVerif ? "High" : "Low"}>
                                    <div className="space-y-4">
                                        <Toggle label="Enable Public Signup" description="Allow anyone to create an account." checked={policies.publicSignup} onChange={(e: any) => triggerChange('publicSignup', e.target.checked)} />
                                        <Toggle label="Require Email Verification" description="Users must click an emailed link before logging in." checked={policies.emailVerif} onChange={(e: any) => triggerChange('emailVerif', e.target.checked)} />
                                        <Toggle label="Require Phone Verification (SMS text)" description="Mandatory phone number mapping (Reduces bots heavily)." checked={policies.phoneVerif} onChange={(e: any) => triggerChange('phoneVerif', e.target.checked)} />
                                        <Toggle label="Require CAPTCHA on Signup" description="Blocks automated creation pipelines." checked={policies.captcha} onChange={(e: any) => triggerChange('captcha', e.target.checked)} />

                                        {!policies.emailVerif && (
                                            <div className="p-3 bg-[#FF7A00]/10 border border-[#FF7A00]/20 rounded-md flex items-start gap-2">
                                                <AlertTriangle className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5" />
                                                <p className="text-[12px] text-[#FF7A00] leading-snug">Disabling Email Verification leaves the platform highly vulnerable to botnets and spam mass-creation.</p>
                                            </div>
                                        )}

                                        <div className="pt-2 flex gap-6">
                                            <Input label="Max Accounts per Email" type="number" value={policies.maxAccPerEmail} onChange={(e: any) => triggerChange('maxAccPerEmail', parseInt(e.target.value))} width="[150px]" />
                                            <Input label="Max Accounts per IP (24h)" type="number" value={policies.maxAccPerIP} onChange={(e: any) => triggerChange('maxAccPerIP', parseInt(e.target.value))} width="[150px]" />
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* 2. USERNAME POLICIES */}
                            <div onClick={() => setActiveContext('username')}>
                                <Card title="2. Username Policies" subtitle="Formatting rules, length limits, and restricted terminology." riskLevel="Low">
                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <Input label="Minimum Length" suffix="chars" type="number" value={policies.userMinLen} onChange={(e: any) => triggerChange('userMinLen', parseInt(e.target.value))} />
                                        <Input label="Maximum Length" suffix="chars" type="number" value={policies.userMaxLen} onChange={(e: any) => triggerChange('userMaxLen', parseInt(e.target.value))} />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2 flex items-center justify-between">
                                                Allowed Characters Format
                                                <span className="text-[11px] text-[#71767B] font-mono flex items-center gap-1"><Regex className="w-3 h-3" /> Regex</span>
                                            </label>
                                            <div className="p-3 bg-[#000000] border border-[#2F3336] rounded-lg font-mono text-[13px] text-[#1D9BF0]">
                                                ^[a-zA-Z0-9_.]*$
                                            </div>
                                            <p className="text-[11px] text-[#71767B] mt-1">Alphanumeric, underscores, and periods only.</p>
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2">Reserved / Blocked Words</label>
                                            <div className="p-2 border border-[#2F3336] rounded-lg bg-[#000000] flex flex-wrap gap-2 min-h-[80px]">
                                                {PRESET_BANNED_WORDS.map(word => (
                                                    <span key={word} className="px-2 py-1 bg-[#2F3336] text-[#E7E9EA] rounded-md text-[12px] flex items-center gap-1.5 font-mono">
                                                        {word} <X className="w-3 h-3 hover:text-[#F91880] cursor-pointer" />
                                                    </span>
                                                ))}
                                                <input type="text" placeholder="Add word..." className="bg-transparent outline-none text-[12px] text-[#E7E9EA] flex-1 min-w-[100px]" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* 3. PASSWORD POLICIES */}
                            <div onClick={() => setActiveContext('password')}>
                                <Card title="3. Password Authentication" subtitle="Cryptographic requirements for user passwords." riskLevel="Critical">
                                    <div className="flex items-center justify-between mb-4 p-3 border border-[#2F3336] rounded-lg bg-[#000000]">
                                        <span className="text-[13px] font-bold text-[#E7E9EA]">Current Policy Strength:</span>
                                        <span className={`text-[14px] font-bold uppercase tracking-wider ${pwdStrength.color}`}>{pwdStrength.label}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                        <Input label="Minimum Password Length" type="number" value={policies.passMinLen} onChange={(e: any) => triggerChange('passMinLen', parseInt(e.target.value))} />
                                        <Input label="Max Password Age (Expiration)" suffix="days" type="number" value={policies.passExp} onChange={(e: any) => triggerChange('passExp', parseInt(e.target.value))} />

                                        <div className="col-span-2 grid grid-cols-2 gap-4 mt-2 p-4 bg-[#000000] border border-[#2F3336] rounded-lg">
                                            <Toggle label="Require Uppercase (A-Z)" checked={policies.passUpper} onChange={(e: any) => triggerChange('passUpper', e.target.checked)} />
                                            <Toggle label="Require Lowercase (a-z)" checked={policies.passLower} onChange={(e: any) => triggerChange('passLower', e.target.checked)} />
                                            <Toggle label="Require Numbers (0-9)" checked={policies.passNum} onChange={(e: any) => triggerChange('passNum', e.target.checked)} />
                                            <Toggle label="Require Symbol (!@#$)" checked={policies.passSpec} onChange={(e: any) => triggerChange('passSpec', e.target.checked)} />
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* 4. AGE & REGION */}
                            <div onClick={() => setActiveContext('age')}>
                                <Card title="4. Age & Region Restrictions" subtitle="Legal borders and onboarding blocks." riskLevel="Critical">
                                    <div className="space-y-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-[0.7]">
                                                <Input label="Minimum Age Threshold" type="number" suffix="years old" value={policies.ageMin} onChange={(e: any) => triggerChange('ageMin', parseInt(e.target.value))} />
                                            </div>
                                            <div className="flex-[1.2] pt-6 pl-4">
                                                <Toggle label="Enforce Hard Age Verification" description="Users must provide ID via Stripe Identity." checked={policies.ageVerif} onChange={(e: any) => triggerChange('ageVerif', e.target.checked)} />
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-[#2F3336]">
                                            <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2 flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-[#71767B]" /> Blocked Country IP Spaces
                                            </label>
                                            <div className="p-3 border border-[#2F3336] rounded-lg bg-[#000000] flex flex-wrap gap-2">
                                                <span className="px-2 py-1 bg-[#2F3336] text-[#E7E9EA] rounded-md text-[12px] flex items-center gap-1.5">
                                                    North Korea (KP) <X className="w-3 h-3 hover:text-[#F91880] cursor-pointer" />
                                                </span>
                                                <span className="px-2 py-1 bg-[#2F3336] text-[#E7E9EA] rounded-md text-[12px] flex items-center gap-1.5">
                                                    Iran (IR) <X className="w-3 h-3 hover:text-[#F91880] cursor-pointer" />
                                                </span>
                                                <input type="text" placeholder="Type country code to block..." className="bg-transparent outline-none text-[12px] text-[#E7E9EA] flex-1 min-w-[150px]" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* 5. ACCOUNT LIFECYCLE */}
                            <div onClick={() => setActiveContext('lifecycle')}>
                                <Card title="5. Lifecycle & Deletion" subtitle="Timers for account recovery and automated purges." riskLevel="Medium">
                                    <div className="space-y-4">
                                        <Input
                                            label="Permanent Deletion Grace Period"
                                            type="number"
                                            suffix="days"
                                            value={policies.delDelay}
                                            onChange={(e: any) => triggerChange('delDelay', parseInt(e.target.value))}
                                        />
                                        <p className="text-[12px] text-[#71767B] -mt-2">When a user requests deletion, their profile is hidden but restorable for this duration before permanent cryptographic erasure.</p>

                                        <div className="p-4 bg-[#000000] border border-[#2F3336] rounded-lg flex flex-col gap-3">
                                            <label className="block text-[13px] font-bold text-[#E7E9EA]">Inactive Account Purge</label>
                                            <Toggle label="Auto-Delete Inactive Accounts" description="Purge accounts unaccessed for over 2 years." checked={false} onChange={() => null} />
                                        </div>
                                    </div>
                                </Card>
                            </div>

                        </div>
                    </div>

                    {/* RIGHT CONTEXT DRAWER */}
                    <div className="w-[300px] bg-[#16181C] border-l border-[#2F3336] p-6 shrink-0 flex flex-col overflow-y-auto z-10">
                        {activeContextData ? (
                            <div className="animate-in fade-in zoom-in-95 duration-200">
                                <h3 className="text-[16px] font-bold text-[#E7E9EA] mb-2">{activeContextData.title}</h3>
                                <p className="text-[13px] text-[#71767B] leading-relaxed mb-6">{activeContextData.desc}</p>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#E7E9EA] uppercase tracking-wider mb-2 opacity-50">Impact Risk</label>
                                        <span className="text-[13px] font-medium text-[#E7E9EA]">{activeContextData.risk}</span>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#E7E9EA] uppercase tracking-wider mb-2 opacity-50">Compliance Impact</label>
                                        <div className="p-3 bg-[#000000] border border-[#2F3336] rounded-lg">
                                            <p className="text-[12px] text-[#71767B]">{activeContextData.compliance}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-[#2F3336]">
                                        <label className="block text-[11px] font-bold text-[#E7E9EA] uppercase tracking-wider mb-2 opacity-50">Last Modified</label>
                                        <div className="flex items-center gap-2 text-[12px] text-[#E7E9EA]">
                                            <Clock className="w-3.5 h-3.5 text-[#71767B]" /> 2 days ago by Sarah C.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                                <Info className="w-8 h-8 text-[#71767B] mb-3" />
                                <p className="text-[13px] text-[#71767B]">Select a policy card to view detailed compliance and impact context.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* STICKY SAVE BAR */}
                {hasUnsavedChanges && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#16181C] border border-[#2F3336] px-6 py-4 rounded-full shadow-2xl flex items-center justify-between gap-8 min-w-[500px] animate-in slide-in-from-bottom-10 fade-in duration-300 z-50">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-[#FFD400]" />
                            <div>
                                <span className="block text-[14px] font-bold text-[#E7E9EA]">Policy changes pending</span>
                                <span className="block text-[12px] text-[#71767B]">These changes affect all global user authentication blocks.</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setHasUnsavedChanges(false)} className="px-4 py-2 text-[13px] font-bold text-[#E7E9EA] hover:bg-[#2F3336] rounded-full transition-colors">Discard</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-[#1D9BF0] text-white text-[13px] font-bold rounded-full flex items-center gap-2 hover:bg-[#1A8CD8] shadow-[0_0_15px_rgba(29,155,240,0.3)] transition-all">
                                <Save className="w-4 h-4" /> Enforce Global Policies
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
