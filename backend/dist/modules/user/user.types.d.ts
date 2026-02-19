import { ObjectId } from 'mongodb';
export interface User {
    _id?: ObjectId;
    name: string;
    email: string;
    password: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateUserInput {
    name: string;
    email: string;
}
export interface UpdateUserInput {
    name?: string;
    email?: string;
}
//# sourceMappingURL=user.types.d.ts.map