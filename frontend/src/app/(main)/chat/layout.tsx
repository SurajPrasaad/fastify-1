
import { ChatLayout } from '@/features/chat/components/ChatLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ChatLayout>
            {children}
        </ChatLayout>
    );
}
