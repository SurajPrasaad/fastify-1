import { ChatRepository } from "./chat.repository.js";
export declare class ChatService {
    private repository;
    constructor(repository: ChatRepository);
    getUserPresence(userId: string): Promise<{
        userId: string;
        status: string;
        lastSeen: Date | null;
    }>;
    setUserPresence(userId: string, status: 'ONLINE' | 'OFFLINE'): Promise<void>;
    getHistory(roomId: string, userId: string, limit: number, before?: string): Promise<(import("mongoose").Document<unknown, {}, import("./chat.model.js").IMessage, {}, import("mongoose").DefaultSchemaOptions> & import("./chat.model.js").IMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getConversations(userId: string, limit: number, offset: number): Promise<(import("mongoose").Document<unknown, {}, import("./chat.model.js").IChatRoom, {}, import("mongoose").DefaultSchemaOptions> & import("./chat.model.js").IChatRoom & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    createRoom(creatorId: string, participants: string[], type: 'DIRECT' | 'GROUP', name?: string): Promise<import("mongoose").Document<unknown, {}, import("./chat.model.js").IChatRoom, {}, import("mongoose").DefaultSchemaOptions> & import("./chat.model.js").IChatRoom & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    markAsRead(userId: string, roomId: string, messageId: string): Promise<import("mongoose").Document<unknown, {}, import("./chat.model.js").IParticipantState, {}, import("mongoose").DefaultSchemaOptions> & import("./chat.model.js").IParticipantState & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=chat.service.d.ts.map