import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { Grades } from '../types/grades';
import { createGrade, getAllGrades, getGradeById, getGradesByStudentId, getGradeAuditLogsByStudentId, updateGrade, deleteGrade, InputGrades } from '../service/gradesService';
import pool from '../db/connection';

async function gradesRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET all grades with optional filters (courseId, subjectId, studentId)
  fastify.get('/grades', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { courseId, subjectId, studentId } = req.query as { courseId?: string; subjectId?: string; studentId?: string };

    if (!courseId && !subjectId && !studentId) {
      return getAllGrades();
    }

    let query = 'SELECT id, student_id as "studentID", subject_id as "subjectID", course_id as "courseID", prelim, midterm, finals, final_grade as "finalGrade", remarks, encoded_by_user_id as "encodedByUserID", created_at as "createdAt", updated_at as "updatedAt" FROM grades WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (courseId) {
      query += ` AND course_id = $${paramCount++}`;
      params.push(courseId);
    }
    if (subjectId) {
      query += ` AND subject_id = $${paramCount++}`;
      params.push(subjectId);
    }
    if (studentId) {
      query += ` AND student_id = $${paramCount++}`;
      params.push(studentId);
    }

    query += ' ORDER BY created_at DESC';

    const result = await (pool as any).query(query, params);
    return result.rows;
  });

  // GET grades by ID
  fastify.get('/grades/:id', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    return getGradeById(id);
  });

  // GET grades by student ID
  fastify.get('/students/:studentID/grades', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { studentID } = req.params as { studentID: string };
    return getGradesByStudentId(studentID);
  });

  // GET grade audit logs by student ID
  fastify.get('/students/:studentID/grade-audit-logs', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { studentID } = req.params as { studentID: string };
    return getGradeAuditLogsByStudentId(studentID);
  });

  // POST create a new grade record (or upsert)
  fastify.post('/grades', async (req: FastifyRequest, _reply: FastifyReply) => {
    return createGrade(req.body as InputGrades);
  });

  // PATCH update grade record
  fastify.patch('/grades/:id', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    return updateGrade(id, req.body as Partial<InputGrades>);
  });

  // DELETE grade record
  fastify.delete('/grades/:id', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    return { deleted: await deleteGrade(id) };
  });
}

export default gradesRoutes;