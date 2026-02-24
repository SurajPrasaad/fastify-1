import { z } from "zod";

export const chatSettingsSchema = z.object({
    enterToSend: z.boolean().optional(),
    typingIndicators: z.boolean().optional(),
    readReceipts: z.boolean().optional(),
    mediaAutoDownload: z.boolean().optional(),
    saveToGallery: z.boolean().optional(),
});

export const supportTicketSchema = z.object({
    subject: z.string().min(5).max(100),
    description: z.string().min(10).max(1000),
    category: z.enum(["ACCOUNT", "PRIVACY", "BILLING", "TECHNICAL", "OTHER"]),
});
