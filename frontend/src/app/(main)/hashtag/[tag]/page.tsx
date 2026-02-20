import { FeedPageContent } from "@/features/feed/components/FeedPageContent";
import { Metadata } from "next";

interface HashtagPageProps {
    params: {
        tag: string;
    };
}

export async function generateMetadata({ params }: HashtagPageProps): Promise<Metadata> {
    const { tag } = await params;
    return {
        title: `#${tag} / Social`,
        description: `Explore posts about #${tag}.`,
    };
}

export default async function HashtagPage({ params }: HashtagPageProps) {
    const { tag } = await params;
    return <FeedPageContent type="hashtag" tag={tag} title={`#${tag}`} />;
}
