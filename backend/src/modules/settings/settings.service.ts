import { SettingsRepository } from "./settings.repository.js";
import type {
    UpdateChatSettingsDto,
    CreateSupportTicketDto
} from "./settings.dto.js";
import { AppError } from "../../utils/AppError.js";
import { logActivity } from "../../utils/audit.js";

export class SettingsService {
    constructor(private settingsRepository: SettingsRepository) { }

    async getChatSettings(userId: string) {
        return this.settingsRepository.getChatSettings(userId);
    }

    async updateChatSettings(userId: string, data: UpdateChatSettingsDto, ipAddress: string) {
        const settings = await this.settingsRepository.updateChatSettings(userId, data);
        await logActivity(userId, "CHAT_SETTINGS_UPDATE", ipAddress, "SUCCESS", data);
        return settings;
    }

    async createTicket(userId: string, data: CreateSupportTicketDto) {
        return this.settingsRepository.createTicket(userId, data);
    }

    async getTickets(userId: string) {
        return this.settingsRepository.getUserTickets(userId);
    }

    async requestDataArchive(userId: string) {
        return this.settingsRepository.createDataRequest(userId);
    }

    async getDataRequests(userId: string) {
        return this.settingsRepository.getDataRequests(userId);
    }

    async getSessions(userId: string) {
        return this.settingsRepository.getSessions(userId);
    }

    async getAuditLogs(userId: string) {
        return this.settingsRepository.getAuditLogs(userId);
    }

    async revokeSession(userId: string, sessionId: string) {
        return this.settingsRepository.revokeSession(userId, sessionId);
    }

    async revokeAllSessions(userId: string) {
        return this.settingsRepository.revokeAllSessions(userId);
    }
}
