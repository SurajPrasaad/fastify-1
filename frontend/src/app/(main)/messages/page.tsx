
import { ChatLayout } from "@/components/chat/chat-layout"

export default function MessagesPage() {
    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
            <h1 className="text-2xl font-bold md:hidden">Messages</h1>
            <ChatLayout />
        </div>
    )
}
