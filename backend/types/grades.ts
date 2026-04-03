export interface Grades {
    id: string;
    studentID: string;
    subjectID: string;
    courseID: string;
    prelim: number;
    midterm: number;
    finals: number;
    finalGrade: number;
    remarks: string;
    encodedByUserID: string;
    createdAt: Date;
    updatedAt: Date;
}