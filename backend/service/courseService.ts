import pool from '../db/connection';
import { Course } from '../types/course';

// CREATE - Add a new course
export async function createCourse(code: string, name: string, description?: string): Promise<Course> {
  const query = `
    INSERT INTO courses (code, name, description, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING id, code, name, description, created_at as "createdAt", updated_at as "updatedAt"
  `;
  const result = await (pool as any).query(query, [code, name, description]);
  return result.rows[0];
}

// READ - Get all courses
export async function getAllCourses(): Promise<Course[]> {
  const query = `
    SELECT id, code, name, description, created_at as "createdAt", updated_at as "updatedAt"
    FROM courses
    ORDER BY created_at DESC
  `;
  const result = await (pool as any).query(query);
  return result.rows;
}

// READ - Get a course by ID
export async function getCourseById(id: string): Promise<Course | null> {
  const query = `
    SELECT id, code, name, description, created_at as "createdAt", updated_at as "updatedAt"
    FROM courses
    WHERE id = $1
  `;
  const result = await (pool as any).query(query, [id]);
  return result.rows[0] || null;
}

// UPDATE - Update a course
export async function updateCourse(
  id: string,
  code?: string,
  name?: string,
  description?: string
): Promise<Course | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (code !== undefined) {
    fields.push(`code = $${paramCount++}`);
    values.push(code);
  }
  if (name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(name);
  }
  if (description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(description);
  }

  if (fields.length === 0) return getCourseById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const query = `
    UPDATE courses
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, code, name, description, created_at as "createdAt", updated_at as "updatedAt"
  `;

  const result = await (pool as any).query(query, values);
  return result.rows[0] || null;
}

// DELETE - Delete a course
export async function deleteCourse(id: string): Promise<boolean> {
  const query = 'DELETE FROM courses WHERE id = $1';
  const result = await (pool as any).query(query, [id]);
  return result.rowCount > 0;
}