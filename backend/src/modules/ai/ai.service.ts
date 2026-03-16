import { GoogleGenerativeAI } from "@google/generative-ai";

export class AIService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("⚠️ GEMINI_API_KEY is not set. AI features might fail.");
        }
        this.genAI = new GoogleGenerativeAI(apiKey || "");
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    async generatePost(prompt: string): Promise<any> {
        const fullPrompt = `You are a social media assistant. Based on this prompt: "${prompt}", generate a social media post.
        You MUST return a JSON object with the following structure:
        {
            "content": "the main text of the post",
            "codeSnippet": { "code": "optional code snippet here", "language": "language name" } or null,
            "poll": { "question": "optional poll question", "options": ["option1", "option2", "option3", "option4"] } or null,
            "imagePrompt": "a detailed descriptive prompt for a relevant image" or null
        }
        Keep the content under 280 characters. If the prompt implies a question, prioritize creating a poll. If it implies technical help, include a code snippet. If it implies visual content, include an imagePrompt.
        Return ONLY the JSON object.`;

        const result = await this.model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text().trim();
        
        try {
            // Remove markdown code blocks if AI included them
            const cleanedJson = text.replace(/```json|```/g, "").trim();
            return JSON.parse(cleanedJson);
        } catch (e) {
            console.error("Failed to parse AI JSON:", text);
            return { content: text, codeSnippet: null, poll: null };
        }
    }

    async improvePost(content: string): Promise<string> {
        const fullPrompt = `Improve this social media post to make it more engaging and professional, while keeping the original meaning: "${content}". Return ONLY the improved text.`;

        const result = await this.model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text().trim();
    }
}

export const aiService = new AIService();
