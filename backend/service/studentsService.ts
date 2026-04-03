import pool from '../db/connection';
import { Student, InputStudent } from '../types/students';

// CREATE - Add a new student
export async function createStudent(data: InputStudent): Promise<Student> {
  const query = `
    INSERT INTO students (student_number, first_name, last_name, email, birth_date, course_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    RETURNING id, student_number as "studentNumber", first_name as "firstName", last_name as "lastName", email, birth_date as "birthDate", course_id as "courseId", created_at as "createdAt", updated_at as "updatedAt"
  `;
  const result = await (pool as any).query(query, [
    data.studentNumber,
    data.firstName,
    data.lastName,
    data.email,
    data.birthDate,
    data.courseId
  ]);
  return result.rows[0];
}

// READ - Get all students
export async function getAllStudents(): Promise<Student[]> {
  const query = `
    SELECT id, student_number as "studentNumber", first_name as "firstName", last_name as "lastName", email, birth_date as "birthDate", course_id as "courseId", created_at as "createdAt", updated_at as "updatedAt"
    FROM students
    ORDER BY created_at DESC
  `;
  const result = await (pool as any).query(query);
  return result.rows;
}

// READ - Get a student by ID
export async function getStudentById(id: string): Promise<Student | null> {
  const query = `
    SELECT id, student_number as "studentNumber", first_name as "firstName", last_name as "lastName", email, birth_date as "birthDate", course_id as "courseId", created_at as "createdAt", updated_at as "updatedAt"
    FROM students
    WHERE id = $1
  `;
  const result = await (pool as any).query(query, [id]);
  return result.rows[0] || null;
}

// UPDATE - Update a student
export async function updateStudent(id: string, data: Partial<InputStudent>): Promise<Student | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.studentNumber !== undefined) {
    fields.push(`student_number = $${paramCount++}`);
    values.push(data.studentNumber);
  }
  if (data.firstName !== undefined) {
    fields.push(`first_name = $${paramCount++}`);
    values.push(data.firstName);
  }
  if (data.lastName !== undefined) {
    fields.push(`last_name = $${paramCount++}`);
    values.push(data.lastName);
  }
  if (data.email !== undefined) {
    fields.push(`email = $${paramCount++}`);
    values.push(data.email);
  }
  if (data.birthDate !== undefined) {
    fields.push(`birth_date = $${paramCount++}`);
    values.push(data.birthDate);
  }
  if (data.courseId !== undefined) {
    fields.push(`course_id = $${paramCount++}`);
    values.push(data.courseId);
  }

  if (fields.length === 0) return getStudentById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const query = `
    UPDATE students
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, student_number as "studentNumber", first_name as "firstName", last_name as "lastName", email, birth_date as "birthDate", course_id as "courseId", created_at as "createdAt", updated_at as "updatedAt"
  `;

  const result = await (pool as any).query(query, values);
  return result.rows[0] || null;
}

// DELETE - Delete a student
export async function deleteStudent(id: string): Promise<boolean> {
  const query = 'DELETE FROM students WHERE id = $1';
  const result = await (pool as any).query(query, [id]);
  return result.rowCount > 0;
}