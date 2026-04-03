import pool from '../db/connection';
import { Subjects } from '../types/subjects';

export interface InputSubjects {
  courseID: string;
  code: string;
  title: string;
  units: number;
}

// CREATE - Add a new subject
export async function createSubject(data: InputSubjects): Promise<Subjects> {
  // Check if subject with same code exists in this course
  const codeExists = await getSubjectByCode(data.courseID, data.code);
  if (codeExists) {
    throw new Error(`Subject with code "${data.code}" already exists in this course`);
  }
  
  // Check if subject with same title exists in this course
  const titleExists = await getSubjectByTitle(data.courseID, data.title);
  if (titleExists) {
    throw new Error(`Subject with title "${data.title}" already exists in this course`);
  }

  const query = `
    INSERT INTO subjects (course_id, code, title, units, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING id, course_id as "courseID", code, title, units, created_at as "createdAt", updated_at as "updatedAt"
  `;
  const result = await (pool as any).query(query, [
    data.courseID,
    data.code,
    data.title,
    data.units
  ]);
  return result.rows[0];
}

// Helper functions
async function getSubjectByCode(courseID: string, code: string): Promise<Subjects | null> {
  const query = `
    SELECT * FROM subjects WHERE course_id = $1 AND code = $2
  `;
  const result = await (pool as any).query(query, [courseID, code]);
  return result.rows[0] || null;
}

async function getSubjectByTitle(courseID: string, title: string): Promise<Subjects | null> {
  const query = `
    SELECT * FROM subjects WHERE course_id = $1 AND title = $2
  `;
  const result = await (pool as any).query(query, [courseID, title]);
  return result.rows[0] || null;
}

// READ - Get all subjects
export async function getAllSubjects(): Promise<Subjects[]> {
  const query = `
    SELECT id, course_id as "courseID", code, title, units, created_at as "createdAt", updated_at as "updatedAt"
    FROM subjects
    ORDER BY created_at DESC
  `;
  const result = await (pool as any).query(query);
  return result.rows;
}

// READ - Get subject by ID
export async function getSubjectById(id: string): Promise<Subjects | null> {
  const query = `
    SELECT id, course_id as "courseID", code, title, units, created_at as "createdAt", updated_at as "updatedAt"
    FROM subjects
    WHERE id = $1
  `;
  const result = await (pool as any).query(query, [id]);
  return result.rows[0] || null;
}

// READ - Get subjects by course ID
export async function getSubjectsByCourseId(courseID: string): Promise<Subjects[]> {
  const query = `
    SELECT id, course_id as "courseID", code, title, units, created_at as "createdAt", updated_at as "updatedAt"
    FROM subjects
    WHERE course_id = $1
    ORDER BY created_at DESC
  `;
  const result = await (pool as any).query(query, [courseID]);
  return result.rows;
}

// UPDATE - Update a subject
export async function updateSubject(id: string, data: Partial<InputSubjects>): Promise<Subjects | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.courseID !== undefined) {
    fields.push(`course_id = $${paramCount++}`);
    values.push(data.courseID);
  }
  if (data.code !== undefined) {
    fields.push(`code = $${paramCount++}`);
    values.push(data.code);
  }
  if (data.title !== undefined) {
    fields.push(`title = $${paramCount++}`);
    values.push(data.title);
  }
  if (data.units !== undefined) {
    fields.push(`units = $${paramCount++}`);
    values.push(data.units);
  }

  if (fields.length === 0) return getSubjectById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const query = `
    UPDATE subjects
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, course_id as "courseID", code, title, units, created_at as "createdAt", updated_at as "updatedAt"
  `;

  const result = await (pool as any).query(query, values);
  return result.rows[0] || null;
}

// DELETE - Delete a subject
export async function deleteSubject(id: string): Promise<boolean> {
  const query = 'DELETE FROM subjects WHERE id = $1';
  const result = await (pool as any).query(query, [id]);
  return result.rowCount > 0;
}