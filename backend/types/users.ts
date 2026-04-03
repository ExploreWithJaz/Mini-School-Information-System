export interface Users {
    id: string;
    email: string;
    passwordHash: string;
    role: string;
    createdDate: Date;
    updatedDate: Date;
}