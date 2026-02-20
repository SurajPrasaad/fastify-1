import { Button } from "@/components/ui/button";
import { Ghost, RefreshCw } from "lucide-react";

export const EmptyState = ({ message = "No posts found yet. Follow someone to see their posts here!" }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
            <Ghost className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold">Feed is empty</h3>
        <p className="text-gray-500 max-w-xs">{message}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Feed
        </Button>
    </div>
);

export const ErrorState = ({ error, retry }: { error: string; retry: () => void }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full">
            <RefreshCw className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold">Something went wrong</h3>
        <p className="text-gray-500 max-w-xs">{error}</p>
        <Button onClick={retry} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
        </Button>
    </div>
);
