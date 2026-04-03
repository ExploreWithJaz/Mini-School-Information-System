import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import pool from '../db/connection';
import { Student, InputStudent } from '../types/students';
import { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent } from '../service/studentsService';

async function studentRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET all students with optional search, filter, pagination
  fastify.get('/students', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { search, courseId, page = '1', limit = '10' } = req.query as { 
      search?: string; 
      courseId?: string; 
      page?: string; 
      limit?: string 
    };

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM students WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR student_number ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (courseId) {
      query += ` AND course_id = $${paramCount++}`;
      params.push(courseId);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = await (pool as any).query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limitNum, offset);

    const result = await (pool as any).query(query, params);

    return {
      data: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  });

  // POST create a new student
  fastify.post('/students', async (req: FastifyRequest, _reply: FastifyReply) => {
    return createStudent(req.body as InputStudent);
  });

  // GET student by ID
  fastify.get('/students/:id', async (req) => {
    const { id } = req.params as { id: string };
    return getStudentById(id);
  });

  // PATCH update student
  fastify.patch('/students/:id', async (req) => {
    const { id } = req.params as { id: string };
    return updateStudent(id, req.body as Partial<InputStudent>);
  });

  // DELETE student
  fastify.delete('/students/:id', async (req) => {
    const { id } = req.params as { id: string };
    return { deleted: await deleteStudent(id) };
  });

  // GET eligible subjects for a student
  fastify.get('/students/:id/eligible-subjects', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string };

    // 1. Get student and their course
    const student = await getStudentById(id);
    if (!student) {
      return { error: 'Student not found', statusCode: 404 };
    }

    // 2. Get all subjects in the student's course
    const subjectsQuery = `
      SELECT id, course_id as "courseID", code, title, units
      FROM subjects
      WHERE course_id = $1
      ORDER BY code
    `;
    const subjectsResult = await (pool as any).query(subjectsQuery, [student.courseId]);
    const subjects = subjectsResult.rows;

    // 3. For each subject, check eligibility and missing prerequisites
    const eligibleSubjects = await Promise.all(
      subjects.map(async (subject: any) => {
        // Get all prerequisites for this subject
        const prereqQuery = `
          SELECT prerequisite_subject_id as "prerequisiteSubjectID"
          FROM subject_prerequisites
          WHERE subject_id = $1
        `;
        const prereqResult = await (pool as any).query(prereqQuery, [subject.id]);
        const prerequisites = prereqResult.rows;

        // If no prerequisites, student is eligible
        if (prerequisites.length === 0) {
          return {
            ...subject,
            eligible: true,
            missingPrerequisites: []
          };
        }

        // Check if student has grades for all prerequisites
        const prereqIds = prerequisites.map((p: any) => p.prerequisiteSubjectID);
        const gradesQuery = `
          SELECT DISTINCT subject_id as "subjectID"
          FROM grades
          WHERE student_id = $1 AND subject_id = ANY($2::text[])
        `;
        const gradesResult = await (pool as any).query(gradesQuery, [id, prereqIds]);
        const satisfiedPrereqIds = gradesResult.rows.map((g: any) => g.subjectID);

        // Find missing prerequisites
        const missingPrereqIds = prereqIds.filter(
          (prereqId: string) => !satisfiedPrereqIds.includes(prereqId)
        );

        // Get details of missing prerequisites
        if (missingPrereqIds.length > 0) {
          const missingQuery = `
            SELECT id, code, title
            FROM subjects
            WHERE id = ANY($1::text[])
          `;
          const missingResult = await (pool as any).query(missingQuery, [missingPrereqIds]);
          
          return {
            ...subject,
            eligible: false,
            missingPrerequisites: missingResult.rows
          };
        }

        return {
          ...subject,
          eligible: true,
          missingPrerequisites: []
        };
      })
    );

    return {
      studentID: id,
      courseID: student.courseId,
      subjects: eligibleSubjects
    };
  });
}

export default studentRoutes;