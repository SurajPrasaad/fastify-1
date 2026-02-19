import { FollowList } from "@/features/follow/components/follow-list";
import { FollowTabs } from "@/features/follow/components/follow-tabs";

interface PageProps {
    params: Promise<{ username: string }>;
}

export default async function FollowersPage({ params }: PageProps) {
    const { username } = await params;

    return (
        <>
            <FollowTabs username={username} activeTab="followers" />
            <FollowList username={username} type="followers" />
        </>
    );
}
