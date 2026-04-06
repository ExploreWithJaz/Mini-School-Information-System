import pool from '../db/connection';
import { SubjectReservations } from '../types/subject_reservations';

export interface InputSubjectReservations {
  studentID: string;
  subjectID: string;
  status: 'reserved' | 'cancelled';
}

// CREATE - Add a new reservation
export async function createReservation(data: InputSubjectReservations): Promise<SubjectReservations> {
  // 1. Check if student already has an active reservation for this subject
  const existingQuery = `
    SELECT id FROM subject_reservations 
    WHERE student_id = $1 AND subject_id = $2 AND status = 'reserved'
  `;
  const existing = await pool.query(existingQuery, [data.studentID, data.subjectID]);

  if (existing.rows.length > 0) {
    throw new Error('Student has already reserved this subject');
  }

  // 2. Validate student.course_id == subject.course_id
  const validationQuery = `
    SELECT s.course_id as "studentCourseID", subj.course_id as "subjectCourseID"
    FROM students s
    JOIN subjects subj ON subj.id = $2
    WHERE s.id = $1
  `;
  const validationResult = await pool.query(validationQuery, [data.studentID, data.subjectID]);
  
  if (validationResult.rows.length === 0) {
    throw new Error('Student or subject not found');
  }

  const { studentCourseID, subjectCourseID } = validationResult.rows[0];
  
  if (studentCourseID !== subjectCourseID) {
    throw new Error('Subject does not belong to the student\'s course');
  }

  // 3. Validate all prerequisites are satisfied
  const prerequisitesQuery = `
    SELECT prerequisite_subject_id FROM subject_prerequisites
    WHERE subject_id = $1
  `;
  const prerequisitesResult = await pool.query(prerequisitesQuery, [data.subjectID]);

  if (prerequisitesResult.rows.length > 0) {
    const prerequisiteIds = prerequisitesResult.rows.map(row => row.prerequisite_subject_id);
    
    // Check if student has grades for ALL prerequisites
    const studentGradesQuery = `
      SELECT subject_id FROM grades
      WHERE student_id = $1 AND subject_id = ANY($2::uuid[])
    `;
    const gradesResult = await pool.query(studentGradesQuery, [data.studentID, prerequisiteIds]);
    
    const completedPrerequisites = new Set(gradesResult.rows.map(row => row.subject_id));
    const allPrerequisitesMet = prerequisiteIds.every(id => completedPrerequisites.has(id));
    
    if (!allPrerequisitesMet) {
      // Get codes of missing prerequisites to provide detailed error message
      const missingPrereqIds = prerequisiteIds.filter(
        (prereqId: string) => !completedPrerequisites.has(prereqId)
      );
      
      const codesQuery = `
        SELECT code FROM subjects WHERE id = ANY($1::uuid[]) ORDER BY code
      `;
      const codesResult = await pool.query(codesQuery, [missingPrereqIds]);
      const missingCodes = codesResult.rows.map(row => row.code);
      
      throw new Error(`Missing prerequisites: [${missingCodes.join(', ')}]`);
    }
  }

  // 4. Check if student already has a grade for this subject (already completed)
  const completionQuery = `
    SELECT id FROM grades
    WHERE student_id = $1 AND subject_id = $2
  `;
  const completionResult = await pool.query(completionQuery, [data.studentID, data.subjectID]);

  if (completionResult.rows.length > 0) {
    throw new Error('Student has already completed this subject');
  }

  const query = `
    INSERT INTO subject_reservations (student_id, subject_id, reserved_at, status)
    VALUES ($1, $2, NOW(), $3)
    RETURNING id, student_id as "studentID", subject_id as "subjectID", reserved_at as "reservedAt", status
  `;
  const result = await (pool as any).query(query, [
    data.studentID,
    data.subjectID,
    data.status
  ]);
  return result.rows[0];
}

// READ - Get all reservations
export async function getAllReservations(): Promise<SubjectReservations[]> {
  const query = `
    SELECT id, student_id as "studentID", subject_id as "subjectID", reserved_at as "reservedAt", status
    FROM subject_reservations
    ORDER BY reserved_at DESC
  `;
  const result = await (pool as any).query(query);
  return result.rows;
}

// READ - Get reservation by ID
export async function getReservationById(id: string): Promise<SubjectReservations | null> {
  const query = `
    SELECT id, student_id as "studentID", subject_id as "subjectID", reserved_at as "reservedAt", status
    FROM subject_reservations
    WHERE id = $1
  `;
  const result = await (pool as any).query(query, [id]);
  return result.rows[0] || null;
}

// READ - Get reservations by student ID
export async function getReservationsByStudentId(studentID: string): Promise<SubjectReservations[]> {
  const query = `
    SELECT id, student_id as "studentID", subject_id as "subjectID", reserved_at as "reservedAt", status
    FROM subject_reservations
    WHERE student_id = $1
    ORDER BY reserved_at DESC
  `;
  const result = await (pool as any).query(query, [studentID]);
  return result.rows;
}

// READ - Get reservations by subject ID
export async function getReservationsBySubjectId(subjectID: string): Promise<SubjectReservations[]> {
  const query = `
    SELECT id, student_id as "studentID", subject_id as "subjectID", reserved_at as "reservedAt", status
    FROM subject_reservations
    WHERE subject_id = $1
    ORDER BY reserved_at DESC
  `;
  const result = await (pool as any).query(query, [subjectID]);
  return result.rows;
}

// UPDATE - Update reservation status
export async function updateReservationStatus(id: string, status: 'reserved' | 'cancelled'): Promise<SubjectReservations | null> {
  const query = `
    UPDATE subject_reservations
    SET status = $1
    WHERE id = $2
    RETURNING id, student_id as "studentID", subject_id as "subjectID", reserved_at as "reservedAt", status
  `;
  const result = await (pool as any).query(query, [status, id]);
  return result.rows[0] || null;
}

// DELETE - Delete a reservation
export async function deleteReservation(id: string): Promise<boolean> {
  const query = 'DELETE FROM subject_reservations WHERE id = $1';
  const result = await (pool as any).query(query, [id]);
  return result.rowCount > 0;
}