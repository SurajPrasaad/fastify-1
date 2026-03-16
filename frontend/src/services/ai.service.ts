export const AIService = {
    async generatePost(prompt: string): Promise<any> {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";
        const response = await fetch(`${API_URL}/ai/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            throw new Error("Failed to generate AI content");
        }

        return await response.json();
    },

    async improvePost(content: string): Promise<string> {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";
        const response = await fetch(`${API_URL}/ai/improve`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content }),
        });

        if (!response.ok) {
            throw new Error("Failed to improve post content");
        }

        const data = await response.json();
        return data.text;
    }
};
