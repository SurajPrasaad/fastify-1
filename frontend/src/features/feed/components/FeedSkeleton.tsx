import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Individual post skeleton — alternates between with/without media
interface PostSkeletonProps {
    showMedia?: boolean;
    lineWidths?: string[];
}

export const PostSkeleton = ({
    showMedia = false,
    lineWidths = ["w-full", "w-4/5"],
}: PostSkeletonProps) => (
    <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800/60 space-y-3 animate-pulse">
        {/* Author row */}
        <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 pt-0.5">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-28 rounded-full" />
                    <Skeleton className="h-3 w-16 rounded-full opacity-60" />
                    <Skeleton className="h-3 w-8 rounded-full opacity-40 ml-auto" />
                </div>
                {/* Text lines */}
                <div className="space-y-1.5 pt-0.5">
                    {lineWidths.map((w, i) => (
                        <Skeleton key={i} className={cn("h-3.5 rounded-full", w)} />
                    ))}
                </div>
                {/* Optional media */}
                {showMedia && (
                    <Skeleton className="h-52 w-full rounded-2xl mt-2" />
                )}
                {/* Action row */}
                <div className="flex items-center gap-6 pt-2">
                    <Skeleton className="h-5 w-10 rounded-full" />
                    <Skeleton className="h-5 w-10 rounded-full" />
                    <Skeleton className="h-5 w-10 rounded-full" />
                    <Skeleton className="h-5 w-8 rounded-full ml-auto" />
                </div>
            </div>
        </div>
    </div>
);

// Skeleton for the sticky "For You / Following" tab header
export const HomeHeaderSkeleton = () => (
    <div className="flex w-full border-b border-slate-200 dark:border-slate-800/50">
        {["For You", "Following"].map((label) => (
            <div key={label} className="flex-1 flex justify-center items-center py-4">
                <Skeleton className="h-4 w-16 rounded-full" />
            </div>
        ))}
    </div>
);

// Full feed skeleton (5 posts with varied layouts)
const POST_VARIANTS: PostSkeletonProps[] = [
    { showMedia: false, lineWidths: ["w-full", "w-3/4"] },
    { showMedia: true, lineWidths: ["w-full", "w-5/6", "w-2/3"] },
    { showMedia: false, lineWidths: ["w-4/5"] },
    { showMedia: true, lineWidths: ["w-full", "w-3/4"] },
    { showMedia: false, lineWidths: ["w-full", "w-2/3", "w-1/2"] },
];

export const FeedSkeleton = () => (
    <div>
        {POST_VARIANTS.map((variant, i) => (
            <PostSkeleton key={i} {...variant} />
        ))}
    </div>
);

// Full home-page skeleton: header tabs + feed posts
export const HomePageSkeleton = () => (
    <div className="flex flex-col min-h-screen">
        {/* Sticky header skeleton */}
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-background-light/80 dark:bg-background-dark/80 border-b border-slate-200 dark:border-slate-800/50">
            <HomeHeaderSkeleton />
        </div>
        {/* Feed posts */}
        <FeedSkeleton />
    </div>
);
