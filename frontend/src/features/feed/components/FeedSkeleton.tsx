import { Skeleton } from "@/components/ui/skeleton";

export const PostSkeleton = () => (
    <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="flex justify-between pt-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
        </div>
    </div>
);

export const FeedSkeleton = () => (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {[...Array(5)].map((_, i) => (
            <PostSkeleton key={i} />
        ))}
    </div>
);
