export interface Student {
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    birthDate: Date;
    courseId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface InputStudent {
    studentNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    birthDate: Date;
    courseId: string;
}