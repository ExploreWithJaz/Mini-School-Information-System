export interface SubjectReservations {
    id: string;
    studentID: string;
    subjectID: string;
    reservedAt: Date;
    status: 'reserved' | 'cancelled';
}