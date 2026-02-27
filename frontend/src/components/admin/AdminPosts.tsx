"use client";

import React, { useState, useMemo } from "react";
import {
    Search, Filter, Download, MoreVertical, ShieldAlert,
    Ban, CheckCircle, X, Image as ImageIcon, Video, FileText,
    MessageSquare, Heart, Share2, AlertTriangle, Eye, ArrowUpRight,
    Flag, RotateCcw, AlertCircle, TrendingUp
} from "lucide-react";
import DataTable, { TableColumn, TableStyles } from "react-data-table-component";

// ==========================================
// 1. TYPES & MOCK DATA
// ==========================================

type PostType = 'Text' | 'Image' | 'Video';
type PostStatus = 'Active' | 'Flagged' | 'Removed';
type RiskLevel = 'Low' | 'Medium' | 'High';

interface PostData {
    id: string;
    authorName: string;
    authorHandle: string;
    authorAvatar: string;
    content: string;
    thumbnail?: string;
    type: PostType;
    status: PostStatus;
    risk: RiskLevel;
    likes: number;
    comments: number;
    shares: number;
    reports: number;
    createdAt: string;
}

const generateMockPosts = (count: number): PostData[] => {
    const types: PostType[] = ['Text', 'Image', 'Video', 'Image'];
    const statuses: PostStatus[] = ['Active', 'Active', 'Flagged', 'Removed', 'Active'];
    const risks: RiskLevel[] = ['Low', 'Low', 'Medium', 'High', 'Low'];

    return Array.from({ length: count }).map((_, i) => ({
        id: `POST-${8000 + i}`,
        authorName: `User ${i + 1}`,
        authorHandle: `@user_${i + 1}`,
        authorAvatar: `https://i.pravatar.cc/150?u=${8000 + i}`,
        content: `This is a sample post content #${i} that might contain some interesting information or maybe just spam. Let's see how the moderation queue handles it!`,
        thumbnail: Math.random() > 0.5 ? `https://picsum.photos/seed/${i}/200` : undefined,
        type: types[Math.floor(Math.random() * types.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        risk: risks[Math.floor(Math.random() * risks.length)],
        likes: Math.floor(Math.random() * 50000),
        comments: Math.floor(Math.random() * 5000),
        shares: Math.floor(Math.random() * 1000),
        reports: Math.floor(Math.random() * 20),
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
    }));
};

const mockData: PostData[] = [
    {
        id: "POST-9284",
        authorName: "Marcus Thorne",
        authorHandle: "@marcus_t",
        authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0LxeD-ZKa4YlHhTJqESa2l8Cd-2RPFU82nrqlak9raNiKaZVcU_zmST9byI2jAcw30SDd5K56kwjDtvk4IpRKPUrmemlZ-qXOrZtXQAU4csRBLLiFo3zUSExkcYLYXIvQ8PqCsjltW6shHrDn0mtZgvmE33kAgfwUe7Qjp8JpdMsZsXRf-GGeWKoL_MpKYUENYFKqEj2jo7FuenupaYduSQYee4WBX8eOdc7f8fSWM837n_QQEd-HfxEJN4a5HczDpX4pWrW_GoI",
        content: "Just landed in Tokyo! The neon lights are absolutely stunning at night and the food here is incredible. Check out my latest vlog!",
        thumbnail: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200&h=200&fit=crop",
        type: "Video",
        status: "Active",
        risk: "Low",
        likes: 12400,
        comments: 428,
        shares: 112,
        reports: 0,
        createdAt: "Oct 24, 2023",
    },
    {
        id: "POST-9102",
        authorName: "Sarah Jenkins",
        authorHandle: "@sarah_j",
        authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTlWk2CLbpGq0lTK4-ruOtqZnYZ9uGOSvzCQYlITqCRNIe8Q4lyBCyKkFqk8D5RJAn9GG4I6SAW3Rq-IqKnc0NdEFQ-dyJq7DvuMRTsvoouLjBLGghPXiixW9nBnWcg1evkgxtfUshNyBXYGR0__agpmJaA_sFs52-VrKLh5_Kou2SwJBdZOOxtxpzC_7ooQGxRaXpbbhvZShaLgT5Cm9STidBJDT6FfT7BEA2X7FKE0Ci0cOhnJljHz0_yXkiXHA2LZKw6hGY1qM",
        content: "Exclusive: New leaked photos of the upcoming electric hypercar. The specs are insane, claim link in bio!",
        thumbnail: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=200&h=200&fit=crop",
        type: "Image",
        status: "Flagged",
        risk: "High",
        likes: 8400,
        comments: 2100,
        shares: 540,
        reports: 142,
        createdAt: "Oct 23, 2023",
    },
    {
        id: "POST-8851",
        authorName: "Liam O'Conner",
        authorHandle: "@liam_oc",
        authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2VwIFomgVsiVCK9TfyqUPeuuj7uSYX3mDew6s0xAuCN6i1kGuY-5elwZ-scQwO6rO8v0ltVjGthQYugrQSrDbQ7cGqkdkPj6lYXtrd0L8jYuvfp1x7EZyDKLV9aGjlWHJCHPO_ZRKdDLTuDZ1SUqsE_rvFKuEoeqSkjNRZhH9Y9kTLxL9TIa6yPhBLimPvbl1cgYhVN6uv_eQcmCPj-xHWkUrCxB3TApZP5iFzGgsZGDfPY9ia2P6RaypJDItFd5M487o14ROaj8",
        content: "[Content removed for policy violation by automated filters]",
        type: "Text",
        status: "Removed",
        risk: "High",
        likes: 0,
        comments: 0,
        shares: 0,
        reports: 45,
        createdAt: "Oct 22, 2023",
    },
    ...generateMockPosts(47)
];

// ==========================================
// 2. DESIGN TOKENS & STYLES (DevAtlas Dark)
// ==========================================

const customStyles: TableStyles = {
    table: {
        style: {
            backgroundColor: 'transparent',
        },
    },
    tableWrapper: {
        style: {
            backgroundColor: 'transparent',
        },
    },
    headRow: {
        style: {
            backgroundColor: '#16181C',
            borderBottomColor: '#2F3336',
            borderBottomWidth: '1px',
            minHeight: '48px',
        },
    },
    headCells: {
        style: {
            fontSize: '11px',
            fontWeight: '700',
            color: '#71767B',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            paddingLeft: '16px',
            paddingRight: '16px',
        },
    },
    cells: {
        style: {
            paddingLeft: '16px',
            paddingRight: '16px',
        },
    },
    rows: {
        style: {
            backgroundColor: '#000000',
            color: '#E7E9EA',
            borderBottomColor: '#2F3336',
            minHeight: '72px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            '&:not(:last-of-type)': {
                borderBottomStyle: 'solid',
                borderBottomWidth: '1px',
            },
        },
        highlightOnHoverStyle: {
            backgroundColor: '#16181C',
            color: '#E7E9EA',
            borderBottomColor: '#2F3336',
            outline: 'none',
            transition: 'all 0.15s ease',
        },
    },
    pagination: {
        style: {
            backgroundColor: '#000000',
            color: '#71767B',
            borderTopColor: '#2F3336',
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            minHeight: '60px',
            fontFamily: 'inherit',
            fontWeight: '600',
            fontSize: '13px',
        },
        pageButtonsStyle: {
            borderRadius: '8px',
            height: '32px',
            width: '32px',
            padding: '4px',
            margin: '0 4px',
            cursor: 'pointer',
            transition: '0.2s',
            color: '#71767B',
            fill: '#71767B',
            backgroundColor: 'transparent',
            '&:disabled': {
                cursor: 'unset',
                color: '#2F3336',
                fill: '#2F3336',
            },
            '&:hover:not(:disabled)': {
                backgroundColor: '#16181C',
                color: '#E7E9EA'
            },
            '&:focus': {
                outline: 'none',
                backgroundColor: '#16181C',
            },
        },
    },
};

const formatNumber = (num: number) => {
    return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num.toString();
};

// ==========================================
// 3. BADGE COMPONENTS
// ==========================================

const PostTypeBadge = ({ type }: { type: PostType }) => {
    const config = {
        Text: { icon: FileText, color: 'text-[#71767B]', bg: 'bg-[#2F3336]' },
        Image: { icon: ImageIcon, color: 'text-[#1D9BF0]', bg: 'bg-[#1D9BF0]/10' },
        Video: { icon: Video, color: 'text-[#8247E5]', bg: 'bg-[#8247E5]/10' }
    };
    const { icon: Icon, color, bg } = config[type];
    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold ${bg} ${color} w-fit`}>
            <Icon className="w-3 h-3" />
            {type}
        </div>
    );
};

const StatusBadge = ({ status }: { status: PostStatus }) => {
    const styles = {
        Active: 'bg-[#00BA7C]/10 text-[#00BA7C] border-[#00BA7C]/20',
        Flagged: 'bg-[#FFD400]/10 text-[#FFD400] border-[#FFD400]/20',
        Removed: 'bg-[#F91880]/10 text-[#F91880] border-[#F91880]/20'
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${styles[status]}`}>
            {status}
        </span>
    );
};

const RiskBadge = ({ risk, reports }: { risk: RiskLevel, reports: number }) => {
    if (reports === 0) return <span className="text-[#71767B] text-[12px]">-</span>;
    const isHigh = risk === 'High' || reports > 50;

    return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${isHigh ? 'bg-[#F91880]/10 text-[#F91880]' : 'bg-[#FFD400]/10 text-[#FFD400]'}`}>
            <Flag className="w-3 h-3" />
            <span className="text-[12px] font-bold">{reports}</span>
        </div>
    );
};

// ==========================================
// 4. DRAWER COMPONENT
// ==========================================

const PostDrawer = ({ post, onClose }: { post: PostData | null, onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'Overview' | 'Engagement' | 'Moderation'>('Overview');

    if (!post) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="w-full max-w-[500px] bg-black border-l border-[#2F3336] h-full shadow-2xl relative flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">

                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-[#2F3336] flex items-center justify-between shrink-0 bg-[#000000]">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 -ml-2 text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#16181C] rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-[18px] font-bold text-[#E7E9EA]">Post Details</h2>
                    </div>
                    <div className="flex gap-2">
                        <a href="#" className="p-2 text-[#71767B] hover:text-[#1D9BF0] hover:bg-[#1D9BF0]/10 rounded-full transition-colors">
                            <ArrowUpRight className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-[#2F3336] px-2 shrink-0 bg-[#000000]">
                    {(['Overview', 'Engagement', 'Moderation'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-[13px] font-bold transition-all relative ${activeTab === tab ? 'text-[#E7E9EA]' : 'text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#16181C]'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1D9BF0] rounded-t-full"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-[#000000]">
                    {activeTab === 'Overview' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Author Info */}
                            <div className="flex items-center justify-between bg-[#16181C] p-4 rounded-xl border border-[#2F3336]">
                                <div className="flex items-center gap-3">
                                    <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <div className="text-[14px] font-bold text-[#E7E9EA]">{post.authorName}</div>
                                        <div className="text-[13px] text-[#71767B]">{post.authorHandle}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[12px] text-[#71767B] mb-1">{post.createdAt}</div>
                                    <StatusBadge status={post.status} />
                                </div>
                            </div>

                            {/* Post Content */}
                            <div>
                                <h4 className="text-[12px] font-bold text-[#71767B] uppercase tracking-wider mb-3">Content</h4>
                                <div className="bg-[#16181C] rounded-xl border border-[#2F3336] p-4">
                                    <p className="text-[15px] text-[#E7E9EA] leading-relaxed mb-4 whitespace-pre-wrap">
                                        {post.content}
                                    </p>

                                    {post.thumbnail && (
                                        <div className="rounded-lg overflow-hidden border border-[#2F3336] relative">
                                            <img src={post.thumbnail} className="w-full h-auto object-cover max-h-[300px]" alt="Post Media preview" />
                                            {post.type === 'Video' && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                                        <Video className="w-6 h-6 text-white" fill="white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Metadata */}
                            <div>
                                <h4 className="text-[12px] font-bold text-[#71767B] uppercase tracking-wider mb-3">Metadata</h4>
                                <div className="bg-[#16181C] rounded-xl border border-[#2F3336] divide-y divide-[#2F3336]">
                                    <div className="flex justify-between p-3.5 text-[14px]">
                                        <span className="text-[#71767B]">Post ID</span>
                                        <span className="text-[#E7E9EA] font-mono">{post.id}</span>
                                    </div>
                                    <div className="flex justify-between p-3.5 text-[14px]">
                                        <span className="text-[#71767B]">Type</span>
                                        <PostTypeBadge type={post.type} />
                                    </div>
                                    <div className="flex justify-between p-3.5 text-[14px]">
                                        <span className="text-[#71767B]">Visibility</span>
                                        <span className="text-[#E7E9EA]">Public</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Engagement' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-[#16181C] rounded-xl border border-[#2F3336] p-4 text-center">
                                    <Heart className="w-5 h-5 text-[#F91880] mx-auto mb-2" />
                                    <div className="text-[20px] font-bold text-[#E7E9EA]">{formatNumber(post.likes)}</div>
                                    <div className="text-[12px] text-[#71767B]">Likes</div>
                                </div>
                                <div className="bg-[#16181C] rounded-xl border border-[#2F3336] p-4 text-center">
                                    <MessageSquare className="w-5 h-5 text-[#1D9BF0] mx-auto mb-2" />
                                    <div className="text-[20px] font-bold text-[#E7E9EA]">{formatNumber(post.comments)}</div>
                                    <div className="text-[12px] text-[#71767B]">Comments</div>
                                </div>
                                <div className="bg-[#16181C] rounded-xl border border-[#2F3336] p-4 text-center">
                                    <Share2 className="w-5 h-5 text-[#00BA7C] mx-auto mb-2" />
                                    <div className="text-[20px] font-bold text-[#E7E9EA]">{formatNumber(post.shares)}</div>
                                    <div className="text-[12px] text-[#71767B]">Shares</div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center p-8 bg-[#16181C] rounded-xl border border-[#2F3336]">
                                <TrendingUp className="w-8 h-8 text-[#2F3336] mb-3" />
                                <p className="text-[13px] text-[#71767B] font-medium text-center">Engagement charts and audience retention graphs will appear here.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Moderation' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {post.reports > 0 ? (
                                <>
                                    <div className={`p-4 rounded-xl border ${post.risk === 'High' ? 'bg-[#F91880]/10 border-[#F91880]/30' : 'bg-[#FFD400]/10 border-[#FFD400]/30'}`}>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert className={`w-5 h-5 ${post.risk === 'High' ? 'text-[#F91880]' : 'text-[#FFD400]'}`} />
                                                <span className={`font-bold text-[15px] ${post.risk === 'High' ? 'text-[#F91880]' : 'text-[#FFD400]'}`}>
                                                    System Alert: {post.risk} Risk Level
                                                </span>
                                            </div>
                                            <p className={`text-[13px] ${post.risk === 'High' ? 'text-[#F91880]/80' : 'text-[#FFD400]/80'}`}>
                                                This post has amassed {post.reports} user reports in a short timeframe, triggering automated analysis.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[12px] font-bold text-[#71767B] uppercase tracking-wider mb-3">Report Breakdown</h4>
                                        <div className="bg-[#16181C] rounded-xl border border-[#2F3336] divide-y divide-[#2F3336]">
                                            <div className="flex justify-between items-center p-3.5">
                                                <span className="text-[14px] text-[#E7E9EA]">Spam or Scam</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-1.5 bg-[#2F3336] rounded-full overflow-hidden">
                                                        <div className="bg-[#FFD400] h-full" style={{ width: '65%' }}></div>
                                                    </div>
                                                    <span className="text-[13px] text-[#71767B] w-4">{Math.floor(post.reports * 0.65)}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center p-3.5">
                                                <span className="text-[14px] text-[#E7E9EA]">Harassment</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-1.5 bg-[#2F3336] rounded-full overflow-hidden">
                                                        <div className="bg-[#F91880] h-full" style={{ width: '25%' }}></div>
                                                    </div>
                                                    <span className="text-[13px] text-[#71767B] w-4">{Math.floor(post.reports * 0.25)}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center p-3.5">
                                                <span className="text-[14px] text-[#E7E9EA]">Other</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-1.5 bg-[#2F3336] rounded-full overflow-hidden">
                                                        <div className="bg-[#1D9BF0] h-full" style={{ width: '10%' }}></div>
                                                    </div>
                                                    <span className="text-[13px] text-[#71767B] w-4">{Math.floor(post.reports * 0.10) || 1}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 bg-[#16181C] rounded-xl border border-[#2F3336]">
                                    <CheckCircle className="w-10 h-10 text-[#00BA7C] mx-auto mb-3" />
                                    <div className="text-[15px] font-bold text-[#E7E9EA] mb-1">Clean Record</div>
                                    <div className="text-[13px] text-[#71767B] text-center">This post currently has zero active reports or moderation strikes.</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-[#2F3336] bg-[#000000] shrink-0 grid grid-cols-2 gap-3">
                    {post.status === 'Removed' ? (
                        <button className="flex items-center justify-center gap-2 py-2.5 bg-[#16181C] hover:bg-[#00BA7C]/10 text-[#00BA7C] border border-[#2F3336] hover:border-[#00BA7C]/50 rounded-xl text-[13px] font-bold transition-colors">
                            <RotateCcw className="w-4 h-4" /> Restore Content
                        </button>
                    ) : (
                        <button className="flex items-center justify-center gap-2 py-2.5 bg-[#16181C] hover:bg-[#F91880]/10 text-[#F91880] border border-[#2F3336] hover:border-[#F91880]/50 rounded-xl text-[13px] font-bold transition-colors">
                            <Ban className="w-4 h-4" /> Remove Post
                        </button>
                    )}
                    <button className="flex items-center justify-center gap-2 py-2.5 bg-[#1D9BF0] hover:bg-[#1D9BF0]/80 text-white rounded-xl text-[13px] font-bold transition-colors shadow-sm">
                        <AlertCircle className="w-4 h-4" /> Escalate to Tier 2
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 5. MAIN PAGE COMPONENT
// ==========================================

export default function PostsManagementPage() {
    const [filterText, setFilterText] = useState("");
    const [selectedRows, setSelectedRows] = useState<PostData[]>([]);
    const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("All Status");
    const [filterType, setFilterType] = useState<string>("All Types");

    const filteredData = useMemo(() => {
        return mockData.filter(item => {
            const matchesSearch =
                item.authorName.toLowerCase().includes(filterText.toLowerCase()) ||
                item.authorHandle.toLowerCase().includes(filterText.toLowerCase()) ||
                item.id.toLowerCase().includes(filterText.toLowerCase()) ||
                item.content.toLowerCase().includes(filterText.toLowerCase());

            const matchesStatus = filterStatus === "All Status" || item.status === filterStatus;
            const matchesType = filterType === "All Types" || item.type === filterType;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [filterText, filterStatus, filterType]);

    const handleRowSelected = ({ selectedRows }: { selectedRows: PostData[] }) => {
        setSelectedRows(selectedRows);
    };

    const columns: TableColumn<PostData>[] = [
        {
            name: 'Post',
            selector: row => row.content,
            cell: row => (
                <div className="flex items-center gap-3 py-3 w-full max-w-[400px]">
                    {row.thumbnail ? (
                        <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-[#2F3336] bg-[#16181C]">
                            <img src={row.thumbnail} className="w-full h-full object-cover" alt="Thumb" />
                            {row.type === 'Video' && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <Video className="w-4 h-4 text-white" fill="white" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="shrink-0 w-12 h-12 rounded-lg border border-[#2F3336] bg-[#16181C] flex items-center justify-center">
                            <FileText className="w-4 h-4 text-[#71767B]" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="text-[13px] text-[#E7E9EA] line-clamp-2 leading-relaxed mb-1" title={row.content}>
                            {row.status === 'Removed' ? <span className="text-[#F91880] italic">[Content Removed]</span> : row.content}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#71767B]">
                            <span>{row.id}</span>
                            <span>•</span>
                            <PostTypeBadge type={row.type} />
                        </div>
                    </div>
                </div>
            ),
            width: '380px'
        },
        {
            name: 'Author',
            selector: row => row.authorName,
            sortable: true,
            cell: row => (
                <div className="flex items-center gap-2.5 py-2">
                    <img className="w-8 h-8 rounded-full border border-[#2F3336] object-cover" src={row.authorAvatar} alt={row.authorName} />
                    <div className="min-w-0">
                        <div className="text-[13px] font-bold text-[#E7E9EA] truncate">{row.authorName}</div>
                        <div className="text-[12px] text-[#71767B] truncate">{row.authorHandle}</div>
                    </div>
                </div>
            ),
            width: '200px'
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            cell: row => <StatusBadge status={row.status} />,
            width: '120px'
        },
        {
            name: 'Flags',
            selector: row => row.reports,
            sortable: true,
            cell: row => <RiskBadge risk={row.risk} reports={row.reports} />,
            width: '100px'
        },
        {
            name: 'Engagement',
            selector: row => row.likes,
            sortable: true,
            cell: row => (
                <div className="flex items-center gap-4 text-[#71767B] text-[12px] font-medium">
                    <div className="flex items-center gap-1.5" title="Likes">
                        <Heart className="w-3.5 h-3.5" />
                        {formatNumber(row.likes)}
                    </div>
                    <div className="flex items-center gap-1.5" title="Comments">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {formatNumber(row.comments)}
                    </div>
                </div>
            ),
            width: '160px'
        },
        {
            name: 'Date',
            selector: row => row.createdAt,
            sortable: true,
            cell: row => <div className="text-[13px] font-medium text-[#71767B]">{row.createdAt}</div>,
            width: '120px'
        },
        {
            name: '',
            cell: row => (
                <button
                    onClick={(e) => { e.stopPropagation(); setSelectedPost(row); }}
                    className="p-2 text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#16181C] rounded-full transition-colors ml-auto"
                >
                    <MoreVertical className="w-[18px] h-[18px]" strokeWidth={2} />
                </button>
            ),
            button: true,
            width: '60px'
        }
    ];

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#000000] text-[#E7E9EA] h-[100vh] font-display">

            {/* Top Toolbar / Header */}
            <div className="px-6 py-5 border-b border-[#2F3336] bg-[#000000]/90 backdrop-blur-md z-10 shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#E7E9EA] flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#1D9BF0]" />
                        Content Moderation
                    </h1>
                    <p className="text-[13px] text-[#71767B] mt-0.5">Review reported posts, manage multimedia content, and escalate severe cases.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 bg-[#000000] border-b border-[#2F3336] flex flex-wrap items-center justify-between gap-4 shrink-0">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
                    <div className="relative w-full max-w-[320px]">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-[#71767B]" />
                        </span>
                        <input
                            type="text"
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                            className="block w-full pl-9 pr-4 py-2 bg-[#16181C] border border-[#2F3336] rounded-full text-[13px] text-[#E7E9EA] placeholder-[#71767B] focus:ring-1 focus:ring-[#1D9BF0] focus:border-[#1D9BF0] outline-none transition-all"
                            placeholder="Search keywords, @handle, or ID..."
                        />
                    </div>

                    <div className="h-6 w-[1px] bg-[#2F3336] hidden sm:block"></div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-[#16181C] border border-[#2F3336] py-2 px-3.5 rounded-full text-[13px] font-bold text-[#E7E9EA] focus:ring-1 focus:ring-[#1D9BF0] outline-none cursor-pointer hover:bg-[#2F3336] transition-colors appearance-none"
                    >
                        <option>All Status</option>
                        <option>Flagged</option>
                        <option>Active</option>
                        <option>Removed</option>
                    </select>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-[#16181C] border border-[#2F3336] py-2 px-3.5 rounded-full text-[13px] font-bold text-[#E7E9EA] focus:ring-1 focus:ring-[#1D9BF0] outline-none cursor-pointer hover:bg-[#2F3336] transition-colors appearance-none"
                    >
                        <option>All Types</option>
                        <option>Text</option>
                        <option>Image</option>
                        <option>Video</option>
                    </select>

                    <button className="flex items-center gap-2 px-3.5 py-2 bg-[#16181C] border border-[#2F3336] rounded-full text-[13px] font-bold text-[#E7E9EA] hover:bg-[#2F3336] transition-colors">
                        <Filter className="w-[14px] h-[14px] text-[#71767B]" /> More Filters
                    </button>
                </div>
            </div>

            {/* Main Data Table Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                <div className="flex-1 overflow-auto bg-[#000000]">
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        pagination
                        paginationPerPage={15}
                        paginationRowsPerPageOptions={[15, 30, 50, 100]}
                        selectableRows
                        onSelectedRowsChange={handleRowSelected}
                        customStyles={customStyles}
                        highlightOnHover
                        pointerOnHover
                        onRowClicked={(row) => setSelectedPost(row)}
                        noDataComponent={
                            <div className="p-12 text-center text-[#71767B] flex flex-col items-center">
                                <Search className="w-10 h-10 mb-4 opacity-50" />
                                <p className="text-[15px] font-bold text-[#E7E9EA] mb-1">No posts found</p>
                                <p className="text-[13px]">Try adjusting your search criteria or review queue.</p>
                            </div>
                        }
                    />
                </div>

                {/* Sticky Bulk Action Bottom Bar */}
                {selectedRows.length > 0 && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-[#16181C] border border-[#2F3336] shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-full px-5 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in z-40">
                        <div className="flex items-center gap-2 text-[14px] font-bold text-[#E7E9EA]">
                            <span className="flex items-center justify-center bg-[#1D9BF0] text-white w-6 h-6 rounded-full text-[12px]">{selectedRows.length}</span>
                            Selected
                        </div>
                        <div className="h-5 w-[1px] bg-[#2F3336]"></div>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-1.5 hover:bg-[#00BA7C]/10 text-[#71767B] hover:text-[#00BA7C] rounded-full text-[13px] font-bold transition-colors">
                                Approve All
                            </button>
                            <button className="px-4 py-1.5 hover:bg-[#F91880]/10 text-[#71767B] hover:text-[#F91880] rounded-full text-[13px] font-bold transition-colors">
                                Remove All
                            </button>
                            <button className="px-4 py-1.5 bg-[#E7E9EA] text-black hover:bg-white rounded-full text-[13px] font-bold transition-colors ml-2 shadow-sm">
                                Export Evidence
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Slide-over Post Detail Drawer */}
            <PostDrawer post={selectedPost} onClose={() => setSelectedPost(null)} />
        </div>
    );
}
