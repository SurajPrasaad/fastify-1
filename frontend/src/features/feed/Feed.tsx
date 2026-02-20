import { FeedPageContent } from "./components/FeedPageContent";

/**
 * Main Feed Component
 * Re-exports the production-grade FeedPageContent for the home feed.
 * This can be customized if the home feed requires specific layout overrides in the future.
 */
export const Feed = () => {
    return <FeedPageContent type="home" title="Home" />;
};
