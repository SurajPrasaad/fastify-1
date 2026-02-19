import { FollowList } from "@/features/follow/components/follow-list";
import { FollowTabs } from "@/features/follow/components/follow-tabs";

interface PageProps {
    params: Promise<{ username: string }>;
}

export default async function FollowingPage({ params }: PageProps) {
    const { username } = await params;

    return (
        <>
            <FollowTabs username={username} activeTab="following" />
            <FollowList username={username} type="following" />
        </>
    );
}
