export interface UpdateChatSettingsDto {
    enterToSend?: boolean;
    typingIndicators?: boolean;
    readReceipts?: boolean;
    mediaAutoDownload?: boolean;
    saveToGallery?: boolean;
}

export interface CreateSupportTicketDto {
    subject: string;
    description: string;
    category: "ACCOUNT" | "PRIVACY" | "BILLING" | "TECHNICAL" | "OTHER";
}

export interface CreateDataRequestDto {
    // Currently no specific fields needed, just triggering it
}
