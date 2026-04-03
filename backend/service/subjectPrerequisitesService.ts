import pool from '../db/connection';
import { SubjectPrerequisites } from '../types/subject_prerequisites';

export interface InputSubjectPrerequisites {
  subjectID: string;
  prerequisiteSubjectID: string;
}

// CREATE - Add a new prerequisite
export async function createPrerequisite(data: InputSubjectPrerequisites): Promise<SubjectPrerequisites> {
  // Prevent self-reference
  if (data.subjectID === data.prerequisiteSubjectID) {
    throw new Error('A subject cannot be a prerequisite of itself');
  }

  // Check if this prerequisite already exists for this subject
  const existingQuery = `
    SELECT id FROM subject_prerequisites 
    WHERE subject_id = $1 AND prerequisite_subject_id = $2
`;
  const existing = await pool.query(existingQuery, [
    data.subjectID, 
    data.prerequisiteSubjectID
]);

  if (existing.rows.length > 0) {
    throw new Error('This prerequisite already exists for the subject');
  }

  // Check for circular prerequisites
  if (await hasCircularPrerequisite(data.subjectID, data.prerequisiteSubjectID)) {
    throw new Error('This would create a circular prerequisite relationship');
  }

  // Check if both subjects belong to the same course
  const subjectsQuery = `
    SELECT course_id FROM subjects 
    WHERE id = $1 OR id = $2
`;
  const subjectsResult = await pool.query(subjectsQuery, [data.subjectID, data.prerequisiteSubjectID]);

  if (subjectsResult.rows.length === 2) {
    const courseIds = subjectsResult.rows.map(row => row.course_id);
    if (courseIds[0] !== courseIds[1]) {
      throw new Error('Prerequisite subject must be in the same course');
    }
  }

  const query = `
    INSERT INTO subject_prerequisites (subject_id, prerequisite_subject_id, created_at)
    VALUES ($1, $2, NOW())
    RETURNING id, subject_id as "subjectID", prerequisite_subject_id as "prerequisiteSubjectID", created_at as "createdAt"
  `;
  const result = await (pool as any).query(query, [
    data.subjectID,
    data.prerequisiteSubjectID
  ]);
  return result.rows[0];
}

// READ - Get all prerequisites
export async function getAllPrerequisites(): Promise<SubjectPrerequisites[]> {
  const query = `
    SELECT id, subject_id as "subjectID", prerequisite_subject_id as "prerequisiteSubjectID", created_at as "createdAt"
    FROM subject_prerequisites
    ORDER BY created_at DESC
  `;
  const result = await (pool as any).query(query);
  return result.rows;
}

// READ - Get prerequisites by subject ID
export async function getPrerequisitesBySubjectId(subjectID: string): Promise<SubjectPrerequisites[]> {
  const query = `
    SELECT id, subject_id as "subjectID", prerequisite_subject_id as "prerequisiteSubjectID", created_at as "createdAt"
    FROM subject_prerequisites
    WHERE subject_id = $1
    ORDER BY created_at DESC
  `;
  const result = await (pool as any).query(query, [subjectID]);
  return result.rows;
}

// READ - Get prerequisite by ID
export async function getPrerequisiteById(id: string): Promise<SubjectPrerequisites | null> {
  const query = `
    SELECT id, subject_id as "subjectID", prerequisite_subject_id as "prerequisiteSubjectID", created_at as "createdAt"
    FROM subject_prerequisites
    WHERE id = $1
  `;
  const result = await (pool as any).query(query, [id]);
  return result.rows[0] || null;
}

// DELETE - Delete a prerequisite
export async function deletePrerequisite(id: string): Promise<boolean> {
  const query = 'DELETE FROM subject_prerequisites WHERE id = $1';
  const result = await (pool as any).query(query, [id]);
  return result.rowCount > 0;
}

// Helper function to detect circular prerequisites
async function hasCircularPrerequisite(subjectID: string, prerequisiteSubjectID: string): Promise<boolean> {
  // Check if the prerequisite_subject_id already has subjectID as a prerequisite (direct cycle)
  const query = `
    SELECT id FROM subject_prerequisites 
    WHERE subject_id = $1 AND prerequisite_subject_id = $2
  `;
  const result = await pool.query(query, [prerequisiteSubjectID, subjectID]);
  return result.rows.length > 0;
}