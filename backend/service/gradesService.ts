import pool from '../db/connection';
import { Grades } from '../types/grades';

export interface InputGrades {
  studentID: string;
  subjectID: string;
  courseID: string;
  prelim: number;
  midterm: number;
  finals: number;
  finalGrade: number;
  remarks: string;
  encodedByUserID: string;
}

export interface GradeAuditLog {
  id: string;
  studentID: string;
  subjectID: string;
  gradeID: string;
  fieldEdited: string;
  oldValue: string | null;
  newValue: string | null;
  editedByUserID: string;
  editedByEmail: string | null;
  editedAt: Date;
  createdAt: Date;
}

function toAuditValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
}

// CREATE - Add a new grade record
export async function createGrade(data: InputGrades): Promise<Grades> {
  // Check if grade already exists for this student-subject-course combination
  const existingQuery = `
    SELECT id FROM grades 
    WHERE student_id = $1 AND subject_id = $2 AND course_id = $3
  `;
  const existing = await pool.query(existingQuery, [
    data.studentID, 
    data.subjectID, 
    data.courseID
  ]);

  if (existing.rows.length > 0) {
    throw new Error('Grade record already exists for this student-subject-course combination. Use update instead.');
  }

  const query = `
    INSERT INTO grades (student_id, subject_id, course_id, prelim, midterm, finals, final_grade, remarks, encoded_by_user_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING id, student_id as "studentID", subject_id as "subjectID", course_id as "courseID", prelim, midterm, finals, final_grade as "finalGrade", remarks, encoded_by_user_id as "encodedByUserID", created_at as "createdAt", updated_at as "updatedAt"
  `;
  const result = await (pool as any).query(query, [
    data.studentID,
    data.subjectID,
    data.courseID,
    data.prelim,
    data.midterm,
    data.finals,
    data.finalGrade,
    data.remarks,
    data.encodedByUserID
  ]);
  return result.rows[0];
}

// READ - Get all grades
export async function getAllGrades(): Promise<Grades[]> {
  const query = `
    SELECT id, student_id as "studentID", subject_id as "subjectID", course_id as "courseID", prelim, midterm, finals, final_grade as "finalGrade", remarks, encoded_by_user_id as "encodedByUserID", created_at as "createdAt", updated_at as "updatedAt"
    FROM grades
    ORDER BY created_at DESC
  `;
  const result = await (pool as any).query(query);
  return result.rows;
}

// READ - Get grades by ID
export async function getGradeById(id: string): Promise<Grades | null> {
  const query = `
    SELECT id, student_id as "studentID", subject_id as "subjectID", course_id as "courseID", prelim, midterm, finals, final_grade as "finalGrade", remarks, encoded_by_user_id as "encodedByUserID", created_at as "createdAt", updated_at as "updatedAt"
    FROM grades
    WHERE id = $1
  `;
  const result = await (pool as any).query(query, [id]);
  return result.rows[0] || null;
}

// READ - Get grades by student ID
export async function getGradesByStudentId(studentID: string): Promise<Grades[]> {
  const query = `
    SELECT id, student_id as "studentID", subject_id as "subjectID", course_id as "courseID", prelim, midterm, finals, final_grade as "finalGrade", remarks, encoded_by_user_id as "encodedByUserID", created_at as "createdAt", updated_at as "updatedAt"
    FROM grades
    WHERE student_id = $1
    ORDER BY created_at DESC
  `;
  const result = await (pool as any).query(query, [studentID]);
  return result.rows;
}

// READ - Get grade audit logs by student ID
export async function getGradeAuditLogsByStudentId(studentID: string): Promise<GradeAuditLog[]> {
  const query = `
    SELECT
      al.id,
      al.student_id as "studentID",
      al.subject_id as "subjectID",
      al.grade_id as "gradeID",
      al.field_edited as "fieldEdited",
      al.old_value as "oldValue",
      al.new_value as "newValue",
      al.edited_by_user_id as "editedByUserID",
      u.email as "editedByEmail",
      al.edited_at as "editedAt",
      al.created_at as "createdAt"
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.edited_by_user_id
    WHERE al.student_id = $1
    ORDER BY al.edited_at DESC, al.created_at DESC
  `;
  const result = await (pool as any).query(query, [studentID]);
  return result.rows;
}

// UPDATE - Update a grade record
export async function updateGrade(id: string, data: Partial<InputGrades>): Promise<Grades | null> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingQuery = `
      SELECT id, student_id as "studentID", subject_id as "subjectID", course_id as "courseID", prelim, midterm, finals, final_grade as "finalGrade", remarks, encoded_by_user_id as "encodedByUserID", created_at as "createdAt", updated_at as "updatedAt"
      FROM grades
      WHERE id = $1
    `;
    const existingResult = await client.query(existingQuery, [id]);
    const existingGrade: Grades | undefined = existingResult.rows[0];

    if (!existingGrade) {
      await client.query('ROLLBACK');
      return null;
    }

  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.studentID !== undefined) {
    fields.push(`student_id = $${paramCount++}`);
    values.push(data.studentID);
  }
  if (data.subjectID !== undefined) {
    fields.push(`subject_id = $${paramCount++}`);
    values.push(data.subjectID);
  }
  if (data.courseID !== undefined) {
    fields.push(`course_id = $${paramCount++}`);
    values.push(data.courseID);
  }
  if (data.prelim !== undefined) {
    fields.push(`prelim = $${paramCount++}`);
    values.push(data.prelim);
  }
  if (data.midterm !== undefined) {
    fields.push(`midterm = $${paramCount++}`);
    values.push(data.midterm);
  }
  if (data.finals !== undefined) {
    fields.push(`finals = $${paramCount++}`);
    values.push(data.finals);
  }
  if (data.finalGrade !== undefined) {
    fields.push(`final_grade = $${paramCount++}`);
    values.push(data.finalGrade);
  }
  if (data.remarks !== undefined) {
    fields.push(`remarks = $${paramCount++}`);
    values.push(data.remarks);
  }
  if (data.encodedByUserID !== undefined) {
    fields.push(`encoded_by_user_id = $${paramCount++}`);
    values.push(data.encodedByUserID);
  }

    if (fields.length === 0) {
      await client.query('ROLLBACK');
      return existingGrade;
    }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const query = `
    UPDATE grades
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, student_id as "studentID", subject_id as "subjectID", course_id as "courseID", prelim, midterm, finals, final_grade as "finalGrade", remarks, encoded_by_user_id as "encodedByUserID", created_at as "createdAt", updated_at as "updatedAt"
  `;

    const result = await client.query(query, values);
    const updatedGrade: Grades | undefined = result.rows[0];

    if (!updatedGrade) {
      await client.query('ROLLBACK');
      return null;
    }

    const editedByUserID = data.encodedByUserID || existingGrade.encodedByUserID;
    const trackedFields: Array<{ key: keyof Grades; auditField: string }> = [
      { key: 'prelim', auditField: 'prelim' },
      { key: 'midterm', auditField: 'midterm' },
      { key: 'finals', auditField: 'finals' },
      { key: 'finalGrade', auditField: 'final_grade' },
      { key: 'remarks', auditField: 'remarks' }
    ];

    for (const field of trackedFields) {
      const oldValue = existingGrade[field.key];
      const newValue = updatedGrade[field.key];

      if (oldValue !== newValue) {
        const auditInsertQuery = `
          INSERT INTO audit_logs (student_id, subject_id, grade_id, field_edited, old_value, new_value, edited_by_user_id, edited_at, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `;
        await client.query(auditInsertQuery, [
          updatedGrade.studentID,
          updatedGrade.subjectID,
          updatedGrade.id,
          field.auditField,
          toAuditValue(oldValue),
          toAuditValue(newValue),
          editedByUserID
        ]);
      }
    }

    await client.query('COMMIT');
    return updatedGrade;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// DELETE - Delete a grade record
export async function deleteGrade(id: string): Promise<boolean> {
  const query = 'DELETE FROM grades WHERE id = $1';
  const result = await (pool as any).query(query, [id]);
  return result.rowCount > 0;
}