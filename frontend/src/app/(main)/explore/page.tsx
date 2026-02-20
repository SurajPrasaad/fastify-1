import { FeedPageContent } from "@/features/feed/components/FeedPageContent";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Explore / Social",
    description: "Discover trending posts and new creators.",
};

export default function ExplorePage() {
    return <FeedPageContent type="explore" title="Explore" />;
}
