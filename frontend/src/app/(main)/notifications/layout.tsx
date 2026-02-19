
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Notifications",
    description: "View your latest updates and alerts.",
};

export default function NotificationsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
