import Link from "next/link";

interface PostContentProps {
    content: string;
}

export const PostContent = ({ content }: PostContentProps) => {
    // Regex to find hashtags
    const parts = content.split(/(\#[a-zA-Z0-9_]+)/g);

    return (
        <div className="text-[15px] leading-normal whitespace-pre-wrap break-words">
            {parts.map((part, i) => {
                if (part.startsWith("#")) {
                    const tag = part.slice(1);
                    return (
                        <Link
                            key={i}
                            href={`/hashtag/${tag}`}
                            className="text-blue-500 hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </Link>
                    );
                }
                return part;
            })}
        </div>
    );
};
