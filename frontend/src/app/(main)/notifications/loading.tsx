import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
    return (
        <div className="container max-w-2xl py-6 mx-auto">
            {/* Header skeleton */}
            <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-32 rounded-md" />
                    </div>
                </div>
                {/* Tab skeleton */}
                <div className="flex gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-16 rounded-sm" />
                    ))}
                </div>
            </div>

            {/* Notification list skeleton */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-start gap-3.5 px-4 py-3.5 border-b border-border/30 last:border-0"
                    >
                        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3.5 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-2.5 w-16" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
