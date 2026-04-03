export interface Course {
	id: string;
	code: string;
	name: string;
	description?: string;
	createdAt: Date;
	updatedAt: Date;
}

// export interface CreateCoursePayload {
// 	code: string;
// 	name: string;
// 	description?: string;
// 	units: number;
// }

// export interface UpdateCoursePayload {
// 	code?: string;
// 	name?: string;
// 	description?: string;
// 	units?: number;
// }
