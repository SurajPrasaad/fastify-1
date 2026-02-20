import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FeedPost } from "../types/feed.types";
import { useState } from "react";

interface RepostModalProps {
    post: FeedPost;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (comment?: string) => void;
}

export const RepostModal = ({ post, isOpen, onClose, onConfirm }: RepostModalProps) => {
    const [comment, setComment] = useState("");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Repost</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Textarea
                        placeholder="Add a comment... (optional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[100px] resize-none border-none focus-visible:ring-0 text-lg"
                    />
                    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 scale-95 opacity-80 pointer-events-none">
                        <div className="font-bold">@{post.user.username}</div>
                        <div className="text-sm truncate">{post.content}</div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        className="rounded-full px-6 font-bold"
                        onClick={() => {
                            onConfirm(comment);
                            onClose();
                        }}
                    >
                        Repost
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
