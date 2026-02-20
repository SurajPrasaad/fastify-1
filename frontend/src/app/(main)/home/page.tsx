import { FeedPageContent } from "@/features/feed/components/FeedPageContent";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Home / Social",
    description: "Your personalized home feed.",
};

export default function HomePage() {
    return <FeedPageContent type="home" title="Home" />;
}
